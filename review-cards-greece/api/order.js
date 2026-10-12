'use strict';
/* POST /api/order — validates the order, recomputes the price on the server (the client total is never trusted),
   emails the shop owner and the customer (Resend), and optionally creates a Stripe Checkout Session for card payments.
   Env: RESEND_API_KEY, ORDER_EMAIL_TO (owner), MAIL_FROM, STRIPE_SECRET_KEY (optional). Without the mail keys it runs in DEMO mode (nothing is recorded). */
const { store, Pricing, V, esc, eur, clip, sendMail, readJson, orderId } = require('./_lib.js');

function validate(b) {
  const e = {}, c = b.customer || {}, s = b.shipping || {}, inv = b.invoice || {};
  if (!V.name(c.name)) e.name = 'Συμπλήρωσε ονοματεπώνυμο.';
  if (!V.email(c.email)) e.email = 'Το email δεν είναι έγκυρο.';
  if (!V.phone(c.phone)) e.phone = 'Το τηλέφωνο πρέπει να είναι ελληνικό (π.χ. 69xxxxxxxx ή 210xxxxxxx).';
  if (!V.name(s.address)) e.address = 'Συμπλήρωσε διεύθυνση.';
  if (!V.tk(s.tk)) e.tk = 'Ο ΤΚ έχει 5 ψηφία.';
  if (!V.name(s.city)) e.city = 'Συμπλήρωσε πόλη.';
  if (!store.regions.includes(s.region)) e.region = 'Διάλεξε περιφέρεια.';
  if (!store.shipping.couriers.some((x) => x.id === b.courier)) e.courier = 'Διάλεξε τρόπο αποστολής.';
  if (!['bank', 'cod', 'card'].includes(b.payment) || !store.payments[b.payment].enabled) e.payment = 'Διάλεξε τρόπο πληρωμής.';
  if (inv.type === 'invoice') {
    if (!V.name(inv.company)) e.company = 'Συμπλήρωσε επωνυμία.';
    if (!V.afm(inv.afm)) e.afm = 'Το ΑΦΜ δεν είναι έγκυρο.';
    if (!V.name(inv.doy)) e.doy = 'Συμπλήρωσε ΔΟΥ.';
    if (!V.name(inv.activity)) e.activity = 'Συμπλήρωσε δραστηριότητα.';
  } else if (inv.type !== 'receipt') e.invoiceType = 'Διάλεξε απόδειξη ή τιμολόγιο.';
  if (!b.acceptTerms) e.acceptTerms = 'Χρειάζεται αποδοχή των όρων.';
  if (!Array.isArray(b.lines) || !b.lines.length || b.lines.length > 60) e.lines = 'Το καλάθι είναι κενό ή πολύ μεγάλο.';
  else b.lines.forEach((l, i) => {
    const d = l.design || {};
    if (!V.name(d.name) || String(d.name).length > 40) e['line' + i] = 'Λείπει το όνομα στην κάρτα (γραμμή ' + (i + 1) + ').';
    else if (!V.httpsUrl(d.link)) e['line' + i] = 'Μη έγκυρο link κριτικής (γραμμή ' + (i + 1) + ').';
    else if (!store.colors.some((x) => x.id === d.color)) e['line' + i] = 'Μη έγκυρο χρώμα (γραμμή ' + (i + 1) + ').';
  });
  return e;
}

function emailHtml(o, forOwner) {
  const rows = o.lines.map((l) => `<tr><td>${esc(l.name)} × ${l.qty}</td><td>${esc(l.design.name)}<br><small>${esc(l.design.link)} · ${esc(l.design.color)}</small></td><td align="right">${eur(l.lineNet)}</td></tr>`).join('');
  const inv = o.invoice.type === 'invoice' ? `Τιμολόγιο: ${esc(o.invoice.company)} · ΑΦΜ ${esc(o.invoice.afm)} · ΔΟΥ ${esc(o.invoice.doy)} · ${esc(o.invoice.activity)}` : 'Απόδειξη λιανικής';
  const pay = o.payment === 'bank' ? 'Τραπεζική κατάθεση' : o.payment === 'cod' ? 'Αντικαταβολή' : 'Κάρτα';
  return `<div style="font-family:Arial,sans-serif;max-width:640px"><h2>${forOwner ? 'Νέα παραγγελία' : 'Ευχαριστούμε για την παραγγελία σου'} ${esc(o.id)}</h2>
  <table width="100%" cellpadding="6" style="border-collapse:collapse" border="1">${rows}</table>
  <p>Καθαρή αξία: ${eur(o.price.net)} · Μεταφορικά: ${eur(o.price.shipping)} · Αντικαταβολή: ${eur(o.price.codFee)} · ΦΠΑ ${Math.round(store.vatRate * 100)}%: ${eur(o.price.vat)}<br><b>Σύνολο: ${eur(o.price.total)}</b></p>
  <p>${esc(o.customer.name)} · ${esc(o.customer.email)} · ${esc(o.customer.phone)}<br>${esc(o.shipping.address)}, ${esc(o.shipping.tk)} ${esc(o.shipping.city)} (${esc(o.shipping.region)}${o.shipping.island ? ', νησί' : ''})<br>Αποστολή: ${esc(o.courierName)} · Πληρωμή: ${pay}<br>${inv}</p>
  ${o.notes ? '<p>Σημειώσεις: ' + esc(o.notes) + '</p>' : ''}
  ${!forOwner && o.payment === 'bank' ? `<p><b>Στοιχεία κατάθεσης</b><br>${esc(store.payments.bank.bank)} · ${esc(store.payments.bank.beneficiary)}<br>IBAN: ${esc(store.payments.bank.iban)}<br>Αιτιολογία: ${esc(o.id)}</p>` : ''}
  ${!forOwner ? `<p>Εκτίμηση: παραγωγή ${esc(store.shipping.productionDays)} από την επιβεβαίωση της πληρωμής ή της παραγγελίας.</p>` : ''}</div>`;
}

async function stripeSession(o, origin) {
  const p = new URLSearchParams();
  p.append('mode', 'payment'); p.append('client_reference_id', o.id);
  p.append('success_url', origin + '/epitixia?o=' + encodeURIComponent(o.id)); p.append('cancel_url', origin + '/tameio');
  p.append('customer_email', o.customer.email); p.append('metadata[order_id]', o.id);
  p.append('line_items[0][quantity]', '1'); p.append('line_items[0][price_data][currency]', 'eur');
  p.append('line_items[0][price_data][unit_amount]', String(o.price.total));
  p.append('line_items[0][price_data][product_data][name]', 'Παραγγελία ' + o.id + ' (με ΦΠΑ)');
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' }, body: p });
  const j = await r.json();
  if (!r.ok) throw new Error('stripe: ' + (j.error && j.error.message));
  return j.url;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'Method not allowed' }); }
  const raw = JSON.stringify(req.body || '');
  if (raw.length > 60000) return res.status(413).json({ ok: false, error: 'Πολύ μεγάλο αίτημα.' });
  const b = readJson(req);
  if (!b) return res.status(400).json({ ok: false, error: 'Μη έγκυρο αίτημα.' });
  if (b.website) return res.status(200).json({ ok: true, mode: 'demo', orderId: 'AST-IGNORED' });     // honeypot: bots fill hidden fields
  const errors = validate(b);
  if (Object.keys(errors).length) return res.status(422).json({ ok: false, errors });

  const s = b.shipping, lines = b.lines.map((l) => ({ sku: String(l.sku), qty: Number(l.qty), design: { name: clip(l.design.name, 40), link: clip(l.design.link, 400), color: l.design.color } }));
  const price = Pricing.price(store, lines, { courier: b.courier, island: !!s.island, payment: b.payment });
  if (price.errors.length) return res.status(422).json({ ok: false, errors: { lines: price.errors.join(' ') } });
  const named = price.lines.map((pl, i) => Object.assign({}, pl, { name: Pricing.product(store, pl.sku).name, design: lines[i].design }));
  const o = {
    id: orderId(), price, lines: named, payment: b.payment, courier: b.courier, courierName: store.shipping.couriers.find((x) => x.id === b.courier).name,
    customer: { name: clip(b.customer.name, 120), email: clip(b.customer.email, 254), phone: clip(b.customer.phone, 30) },
    shipping: { address: clip(s.address, 160), tk: clip(s.tk, 5), city: clip(s.city, 80), region: s.region, island: !!s.island },
    invoice: b.invoice.type === 'invoice' ? { type: 'invoice', company: clip(b.invoice.company, 120), afm: clip(b.invoice.afm, 9), doy: clip(b.invoice.doy, 80), activity: clip(b.invoice.activity, 120) } : { type: 'receipt' },
    notes: clip(b.notes, 1000), marketing: !!b.marketing
  };
  const owner = process.env.ORDER_EMAIL_TO, live = !!(process.env.RESEND_API_KEY && owner);
  const summary = { id: o.id, total: price.total, payment: o.payment, lines: named.length };
  if (!live) return res.status(200).json({ ok: true, mode: 'demo', orderId: o.id, summary, price });
  try {
    let url = null;
    if (o.payment === 'card') {
      if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ ok: false, error: 'Η πληρωμή με κάρτα δεν είναι διαθέσιμη αυτή τη στιγμή.' });
      const origin = (store.site || '').replace(/\/$/, '') || ('https://' + req.headers.host);
      url = await stripeSession(o, origin);
    }
    const m1 = await sendMail({ to: owner, subject: `Νέα παραγγελία ${o.id} (${eur(price.total)})`, html: emailHtml(o, true), replyTo: o.customer.email });
    if (!m1.sent) return res.status(502).json({ ok: false, error: 'Δεν καταχωρήθηκε η παραγγελία. Δοκίμασε ξανά ή επικοινώνησε μαζί μας.' });
    await sendMail({ to: o.customer.email, subject: `Η παραγγελία σου ${o.id}`, html: emailHtml(o, false) }).catch(() => {});
    return res.status(200).json({ ok: true, mode: 'live', orderId: o.id, summary, price, paymentUrl: url });
  } catch (err) {
    return res.status(502).json({ ok: false, error: 'Προέκυψε σφάλμα. Η παραγγελία δεν καταχωρήθηκε.' });
  }
};
module.exports.validate = validate;
