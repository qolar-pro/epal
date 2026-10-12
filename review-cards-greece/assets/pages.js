/* Page controllers. The active page is set by <body data-page="...">. */
(function () {
  'use strict';
  var A = window.App, S = A.S, P = A.P, V = A.V, el = A.el, eur = A.eur, Cart = A.Cart, D = window.Designer;
  var $ = function (id) { return document.getElementById(id); };
  var page = document.body.getAttribute('data-page');
  var DEFAULT_LINK = 'https://search.google.com/local/writereview?placeid=EXAMPLE_PLACE_ID';
  function prod(sku) { return P.product(S, sku); }
  function last() { return A.sget('aster.last') || { name: '', link: '', color: 'graphite' }; }
  function setField(node, msg) { if (!node) return; node.setAttribute('aria-invalid', msg ? 'true' : 'false'); var f = document.querySelector('.fe[data-for="' + node.id + '"]'); if (f) f.textContent = msg || ''; }
  document.addEventListener('input', function (e) { var n = e.target; if (n && n.getAttribute && n.getAttribute('aria-invalid') === 'true') setField(n, ''); });
  function previewNode(sku, design) { var n = el('div'); D.paint(n, sku, { name: design.name, color: design.color, qr: D.encode(design.link) }); return n; }

  /* ---------- home ---------- */
  if (page === 'home') {
    var hc = $('heroCard'); D.paint(hc, 'card', { name: 'Καφέ Αστέρι', color: 'graphite', qr: D.encode('https://g.page/r/example/review') }); A.tilt($('heroStage'), hc);
    var wordsEl = $('words'), spans;
    wordsEl.innerHTML = wordsEl.textContent.trim().split(/\s+/).map(function (w) { return '<span>' + D.esc(w) + '</span>'; }).join(' ');
    spans = Array.prototype.slice.call(wordsEl.children);
    var light = function () {
      if (A.reduce) { spans.forEach(function (s) { s.classList.add('lit'); }); return; }
      var r = wordsEl.getBoundingClientRect(), vh = window.innerHeight, p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height + vh * 0.25)));
      spans.forEach(function (s, i) { s.classList.toggle('lit', i / spans.length < p * 1.05); });
    };
    window.addEventListener('scroll', light, { passive: true }); window.addEventListener('resize', light); light();
  }

  /* ---------- catalog ---------- */
  if (page === 'catalog' || page === 'home') {
    Array.prototype.forEach.call(document.querySelectorAll('.thumb[data-sku]'), function (t) {
      var n = el('div'); t.appendChild(n); D.paint(n, t.getAttribute('data-sku'), { name: 'Καφέ Αστέρι', color: t.getAttribute('data-color') || 'graphite', qr: D.encode('https://g.page/r/example/review') });
      n.style.transform = 'none';
    });
  }

  /* ---------- product page ---------- */
  if (page === 'product') {
    var sku = document.body.getAttribute('data-sku'), p = prod(sku), L = last();
    var st = { name: L.name || '', link: L.link || '', color: L.color || 'graphite', qty: 10 };
    var stage = $('stage-card'), nameI = $('p-name'), linkI = $('p-link'), qtyI = $('p-qty');
    nameI.value = st.name; linkI.value = st.link;
    S.colors.forEach(function (c) {
      var b = el('button', { type: 'button', class: 'sw', title: c.name, 'aria-label': c.name, 'aria-pressed': c.id === st.color ? 'true' : 'false', style: 'background:' + c.hex });
      b.addEventListener('click', function () { st.color = c.id; Array.prototype.forEach.call($('swatches').children, function (x, i) { x.setAttribute('aria-pressed', S.colors[i].id === c.id ? 'true' : 'false'); }); $('colorName').textContent = c.name; repaint(); });
      $('swatches').appendChild(b);
    });
    $('colorName').textContent = D.colorOf(st.color).name;
    var diag = null;
    function repaint() {
      st.name = nameI.value; st.link = linkI.value.trim(); st.qty = Math.max(1, Math.min(5000, parseInt(qtyI.value, 10) || 1));
      $('p-msg').textContent = '';
      diag = st.link ? D.diagnose(st.link) : { cls: '', tag: '', text: 'Βάλε το link κριτικής σου για να δεις τον QR.', ok: false };
      var box = $('p-doctor'); box.className = 'doctor ' + diag.cls; box.textContent = ''; if (diag.tag) box.appendChild(el('b', { class: diag.cls }, diag.tag + ' ')); box.appendChild(document.createTextNode(diag.text));
      D.paint(stage, sku, { name: st.name, color: st.color, qr: diag.ok ? D.encode(st.link) : null });
      var combined = st.qty + Cart.skuQty(sku), rate = P.tierRate(S, combined), unit = Math.round(p.price * 100), unitNet = Math.round(unit * (1 - rate));
      $('tiers').textContent = '';
      S.discounts.forEach(function (d, i) {
        var next = S.discounts[i + 1], active = combined >= d.min && (!next || combined < next.min);
        $('tiers').appendChild(el('div', { class: 'tier', 'aria-current': active ? 'true' : 'false' }, el('b', null, d.min + (next ? '–' + (next.min - 1) : '+')), el('span', null, d.rate ? '−' + Math.round(d.rate * 100) + '%' : 'τιμή καταλόγου')));
      });
      $('p-unit').textContent = eur(A.Vat.cents(unitNet)) + ' / ' + (p.unit || 'τεμ.'); $('p-total').textContent = eur(A.Vat.cents(unitNet * st.qty)); $('p-vatl').textContent = A.Vat.label();
      $('p-tiernote').textContent = Cart.skuQty(sku) ? 'Στην ποσότητα προσμετράται και ό,τι έχεις ήδη στο καλάθι (' + Cart.skuQty(sku) + ').' : '';
    }
    [nameI, linkI, qtyI].forEach(function (i) { i.addEventListener('input', repaint); });
    $('qty-dec').addEventListener('click', function () { qtyI.value = Math.max(1, (parseInt(qtyI.value, 10) || 1) - 1); repaint(); });
    $('qty-inc').addEventListener('click', function () { qtyI.value = Math.min(5000, (parseInt(qtyI.value, 10) || 0) + 1); repaint(); });
    document.addEventListener('vat:changed', repaint);
    A.tilt($('pdp-stage'), stage);
    $('p-add').addEventListener('click', function () {
      var msg = $('p-msg'); msg.textContent = '';
      if (!V.name(st.name) || st.name.length > 40) { msg.textContent = 'Γράψε το όνομα που θα τυπωθεί (έως 40 χαρακτήρες).'; nameI.focus(); return; }
      if (!V.httpsUrl(st.link)) { msg.textContent = 'Βάλε έγκυρο link κριτικής που ξεκινά με https://'; linkI.focus(); return; }
      if (diag.sample && !S.demo) { msg.textContent = 'Αυτό είναι δείγμα link. Βάλε το δικό σου.'; linkI.focus(); return; }
      Cart.add({ sku: sku, qty: st.qty, design: { name: st.name.trim(), link: st.link, color: st.color } });
      A.sset('aster.last', { name: st.name, link: st.link, color: st.color });
      A.toast('Προστέθηκε στο καλάθι: ' + p.name + ' × ' + st.qty + '.', '/kalathi', 'Δες το καλάθι ›'); repaint();
    });
    repaint();
  }

  /* ---------- cart ---------- */
  if (page === 'cart') {
    var root = $('cart-root');
    var draw = function () {
      root.textContent = '';
      var items = Cart.items();
      if (!items.length) { root.appendChild(el('div', { class: 'empty', style: 'grid-column:1/-1' }, el('h2', null, 'Το καλάθι σου είναι άδειο.'), el('p', null, el('a', { class: 'btn', href: '/proionta' }, 'Δες τα προϊόντα')))); return; }
      var left = el('div'); root.appendChild(left);
      items.forEach(function (it) {
        var p = prod(it.sku), pr = P.price(S, Cart.lines(), {}), lineIdx = items.indexOf(it), pl = pr.lines[lineIdx];
        var dec = el('button', { type: 'button', 'aria-label': 'Λιγότερα' }, '−'), inc = el('button', { type: 'button', 'aria-label': 'Περισσότερα' }, '+'), qi = el('input', { type: 'number', min: 1, max: 5000, value: it.qty, 'aria-label': 'Ποσότητα' });
        dec.addEventListener('click', function () { Cart.setQty(it.id, it.qty - 1); }); inc.addEventListener('click', function () { Cart.setQty(it.id, it.qty + 1); });
        qi.addEventListener('change', function () { Cart.setQty(it.id, parseInt(qi.value, 10) || 1); });
        var rm = el('button', { type: 'button', class: 'rm' }, 'Αφαίρεση'); rm.addEventListener('click', function () { Cart.remove(it.id); });
        left.appendChild(el('div', { class: 'line' }, el('div', { class: 'mini' }, previewNode(it.sku, it.design)),
          el('div', null, el('h3', null, p.name), el('small', null, it.design.name), el('small', null, it.design.link), el('small', null, 'Χρώμα: ' + D.colorOf(it.design.color).name + (pl && pl.rate ? ' · έκπτωση ' + Math.round(pl.rate * 100) + '%' : '')), rm),
          el('div', { style: 'text-align:right' }, el('div', { class: 'stepper' }, dec, qi, inc), el('p', { style: 'margin:8px 0 0;font-weight:600' }, pl ? eur(A.Vat.cents(pl.lineNet)) : ''), el('small', null, A.Vat.label()))));
      });
      var r = P.price(S, Cart.lines(), {}), tb = el('tbody');
      [['Υποσύνολο', eur(A.Vat.cents(r.subtotal))], ['Έκπτωση ποσότητας', r.discount ? '−' + eur(A.Vat.cents(r.discount)) : '—'], ['Καθαρή αξία' + (A.Vat.mode() === 'inc' ? ' (με ΦΠΑ)' : ' (χωρίς ΦΠΑ)'), eur(A.Vat.cents(r.net))]].forEach(function (x, i, a) { tb.appendChild(el('tr', i === a.length - 1 ? { class: 'total' } : null, el('th', { scope: 'row' }, x[0]), el('td', null, x[1]))); });
      var free = Math.max(0, Math.round(S.shipping.freeFrom * 100) - r.net);
      root.appendChild(el('aside', { class: 'card-box aside-sticky' }, el('h2', null, 'Σύνοψη'), el('table', { class: 'sum' }, tb),
        el('p', { class: 'fine' }, free ? 'Δωρεάν μεταφορικά για την ηπειρωτική Ελλάδα από ' + eur(Math.round(S.shipping.freeFrom * 100)) + ' (χωρίς ΦΠΑ): σου λείπουν ' + eur(free) + '.' : 'Έχεις δωρεάν μεταφορικά για την ηπειρωτική Ελλάδα.'),
        el('p', { class: 'fine' }, 'Μεταφορικά, ΦΠΑ και τελικό σύνολο υπολογίζονται στο ταμείο.'),
        el('p', null, el('a', { class: 'btn block', href: '/tameio' }, 'Συνέχεια στο ταμείο')), el('p', null, el('a', { class: 'lnk', href: '/proionta' }, 'Συνέχισε τις αγορές'))));
    };
    document.addEventListener('cart:changed', draw); document.addEventListener('vat:changed', draw); draw();
  }

  /* ---------- checkout ---------- */
  if (page === 'checkout') {
    var form = $('co'), money = function (c) { return eur(c); }, errs = {};
    S.regions.forEach(function (r) { form.region.appendChild(el('option', { value: r }, r)); });
    var cl = $('ship-list'); S.shipping.couriers.forEach(function (c, i) {
      var lab = el('label', { class: 'radio' }, el('input', { type: 'radio', name: 'courier', value: c.id, checked: i === 0 }), el('span', null, el('b', null, c.name), el('small', null, c.eta)), el('span', { class: 'amt', 'data-courier': c.id }));
      cl.appendChild(lab);
    });
    var pl = $('pay-list');
    [['bank', 'Θα δεις τα στοιχεία στην επόμενη σελίδα και στο email σου. Η παραγγελία προχωρά μετά την πληρωμή.'], ['cod', 'Πληρώνεις στον κούριερ. ' + 'Επιβάρυνση ' + eur(Math.round(S.payments.cod.fee * 100)) + ' + ΦΠΑ.'], ['card', 'Ασφαλής πληρωμή μέσω παρόχου.']].forEach(function (x, i) {
      var cfg = S.payments[x[0]]; if (!cfg.enabled) return;
      pl.appendChild(el('label', { class: 'radio' }, el('input', { type: 'radio', name: 'payment', value: x[0], checked: pl.children.length === 0 }), el('span', null, el('b', null, cfg.label), el('small', null, x[1]))));
    });
    function opts() { return { courier: form.courier.value, island: form.island.checked, payment: form.payment.value }; }
    function sum() {
      var items = Cart.items(), r = P.price(S, Cart.lines(), opts()), o = $('co-sum'); o.textContent = '';
      if (!items.length) { o.appendChild(el('p', null, 'Το καλάθι είναι άδειο. ', el('a', { href: '/proionta' }, 'Δες τα προϊόντα'))); return r; }
      var tb = el('tbody');
      r.lines.forEach(function (l, i) { tb.appendChild(el('tr', null, el('th', { scope: 'row' }, prod(l.sku).name + ' × ' + l.qty + ' · ' + items[i].design.name), el('td', null, money(l.lineNet)))); });
      [['Καθαρή αξία', money(r.net)], ['Μεταφορικά', r.shipping ? money(r.shipping) : (r.freeShipping ? 'Δωρεάν' : '—')], r.codFee ? ['Αντικαταβολή', money(r.codFee)] : null, ['ΦΠΑ ' + Math.round(S.vatRate * 100) + '%', money(r.vat)], ['Σύνολο', money(r.total)]].filter(Boolean).forEach(function (x, i, a) { tb.appendChild(el('tr', i === a.length - 1 ? { class: 'total' } : null, el('th', { scope: 'row' }, x[0]), el('td', null, x[1]))); });
      o.appendChild(el('table', { class: 'sum' }, tb));
      Array.prototype.forEach.call(document.querySelectorAll('[data-courier]'), function (n) {
        var c = S.shipping.couriers.filter(function (x) { return x.id === n.getAttribute('data-courier'); })[0], free = r.net >= Math.round((form.island.checked ? S.shipping.freeFromIslands : S.shipping.freeFrom) * 100);
        n.textContent = free ? 'Δωρεάν' : eur(Math.round((form.island.checked ? c.islands : c.mainland) * 100)) + ' + ΦΠΑ';
      });
      return r;
    }
    function toggleInvoice() { var inv = form.invoice.value === 'invoice'; $('inv-fields').classList.toggle('hide', !inv); }
    Array.prototype.forEach.call(form.querySelectorAll('input[name=invoice]'), function (r) { r.addEventListener('change', toggleInvoice); });
    form.addEventListener('change', sum); form.addEventListener('input', function (e) { if (e.target.name === 'tk' || e.target.name === 'island') sum(); });
    document.addEventListener('cart:changed', sum); toggleInvoice(); sum();

    function collect() {
      var f = form, inv = f.invoice.value;
      return { customer: { name: f.name.value, email: f.email.value, phone: f.phone.value }, shipping: { address: f.address.value, tk: f.tk.value.replace(/\s/g, ''), city: f.city.value, region: f.region.value, island: f.island.checked },
        courier: f.courier.value, payment: f.payment.value, invoice: inv === 'invoice' ? { type: 'invoice', company: f.company.value, afm: f.afm.value.replace(/\s/g, ''), doy: f.doy.value, activity: f.activity.value } : { type: 'receipt' },
        notes: f.notes.value, acceptTerms: f.acceptTerms.checked, marketing: f.marketing.checked, website: f.website.value,
        lines: Cart.items().map(function (x) { return { sku: x.sku, qty: x.qty, design: x.design }; }) };
    }
    function clientValidate(b) {
      var e = {};
      if (!V.name(b.customer.name)) e.name = 'Συμπλήρωσε ονοματεπώνυμο.'; if (!V.email(b.customer.email)) e.email = 'Το email δεν είναι έγκυρο.';
      if (!V.phone(b.customer.phone)) e.phone = 'Ελληνικό τηλέφωνο, π.χ. 69xxxxxxxx ή 210xxxxxxx.';
      if (!V.name(b.shipping.address)) e.address = 'Συμπλήρωσε διεύθυνση.'; if (!V.tk(b.shipping.tk)) e.tk = 'Ο ΤΚ έχει 5 ψηφία.'; if (!V.name(b.shipping.city)) e.city = 'Συμπλήρωσε πόλη.'; if (!b.shipping.region) e.region = 'Διάλεξε περιφέρεια.';
      if (b.invoice.type === 'invoice') { if (!V.name(b.invoice.company)) e.company = 'Συμπλήρωσε επωνυμία.'; if (!V.afm(b.invoice.afm)) e.afm = 'Το ΑΦΜ δεν είναι έγκυρο (9 ψηφία).'; if (!V.name(b.invoice.doy)) e.doy = 'Συμπλήρωσε ΔΟΥ.'; if (!V.name(b.invoice.activity)) e.activity = 'Συμπλήρωσε δραστηριότητα.'; }
      if (!b.acceptTerms) e.acceptTerms = 'Χρειάζεται αποδοχή των όρων.'; if (!b.lines.length) e.lines = 'Το καλάθι είναι άδειο.';
      return e;
    }
    function showErrors(e) {
      Array.prototype.forEach.call(form.querySelectorAll('input,select'), function (n) { if (n.name) setField(n, e[n.name] || ''); });
      var first = null; Object.keys(e).forEach(function (k) { var n = form.elements[k]; if (n && !first) first = n; });
      $('co-msg').textContent = e.lines || e.courier || e.payment || (Object.keys(e).length ? 'Έλεγξε τα πεδία που σημειώθηκαν.' : '');
      if (first && first.focus) first.focus();
    }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var b = collect(), e = clientValidate(b); showErrors(e); if (Object.keys(e).length) return;
      var btn = $('co-submit'); btn.disabled = true; btn.textContent = 'Αποστολή…';
      var done = function () { btn.disabled = false; btn.textContent = 'Ολοκλήρωση παραγγελίας'; };
      fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); }).then(function (x) {
        if (x.s === 422 && x.j.errors) { showErrors(x.j.errors); return done(); }
        if (!x.j.ok) { $('co-msg').textContent = x.j.error || 'Σφάλμα. Δοκίμασε ξανά.'; return done(); }
        A.sset('aster.order', { id: x.j.orderId, mode: x.j.mode, price: x.j.price, payment: b.payment, customer: b.customer, email: b.customer.email, courier: b.courier, lines: b.lines, shipping: b.shipping, invoice: b.invoice }, true);
        if (x.j.mode === 'live') Cart.clear();
        location.href = x.j.paymentUrl || ('/epitixia?o=' + encodeURIComponent(x.j.orderId));
      }).catch(function () { offline(b); done(); });
    });
    function offline(b) {
      var r = P.price(S, Cart.lines(), opts()), txt = ['Παραγγελία ' + S.brand, 'Σύνολο (με ΦΠΑ): ' + money(r.total), '', b.customer.name + ' · ' + b.customer.email + ' · ' + b.customer.phone, b.shipping.address + ', ' + b.shipping.tk + ' ' + b.shipping.city, 'Παραστατικό: ' + (b.invoice.type === 'invoice' ? 'Τιμολόγιο ' + b.invoice.company + ' ΑΦΜ ' + b.invoice.afm : 'Απόδειξη'), ''].concat(b.lines.map(function (l) { return prod(l.sku).name + ' × ' + l.qty + ' — ' + l.design.name + ' — ' + l.design.link + ' — ' + l.design.color; })).join('\n');
      var ta = el('textarea', { readonly: '', rows: '10' }); ta.value = txt; var box = $('co-result'); box.textContent = '';
      box.appendChild(el('div', { class: 'demo-box' }, 'Δεν ήταν δυνατή η επικοινωνία με τον διακομιστή, άρα η παραγγελία ΔΕΝ έχει καταχωρηθεί. Αντίγραψε το κείμενο και στείλ’ το σε εμάς.')); box.appendChild(ta);
      if (S.company.email) box.appendChild(el('p', null, el('a', { class: 'btn', href: 'mailto:' + S.company.email + '?subject=' + encodeURIComponent('Παραγγελία ' + S.brand) + '&body=' + encodeURIComponent(txt) }, 'Άνοιγμα email')));
    }
  }

  /* ---------- success ---------- */
  if (page === 'success') {
    var o = A.sget('aster.order', true), box = $('ok-root'); box.textContent = '';
    if (!o) box.appendChild(el('div', { class: 'empty' }, el('h2', null, 'Δεν βρέθηκε πρόσφατη παραγγελία.'), el('p', null, el('a', { class: 'btn', href: '/proionta' }, 'Δες τα προϊόντα'))));
    else {
      if (o.mode === 'demo') box.appendChild(el('div', { class: 'demo-box' }, 'Δοκιμαστική λειτουργία: αυτή η παραγγελία ΔΕΝ έχει καταχωρηθεί και δεν θα εκτελεστεί. Τα στοιχεία ενεργοποιούνται όταν ο ιστότοπος τεθεί σε λειτουργία.'));
      var tbl = el('tbody'); (o.price.lines || []).forEach(function (l, i) { tbl.appendChild(el('tr', null, el('th', { scope: 'row' }, prod(l.sku).name + ' × ' + l.qty + ' · ' + o.lines[i].design.name), el('td', null, eur(l.lineNet)))); });
      [['Μεταφορικά', o.price.shipping ? eur(o.price.shipping) : 'Δωρεάν'], o.price.codFee ? ['Αντικαταβολή', eur(o.price.codFee)] : null, ['ΦΠΑ', eur(o.price.vat)], ['Σύνολο', eur(o.price.total)]].filter(Boolean).forEach(function (x, i, a) { tbl.appendChild(el('tr', i === a.length - 1 ? { class: 'total' } : null, el('th', { scope: 'row' }, x[0]), el('td', null, x[1]))); });
      var ok = el('div', { class: 'ok-box' }, el('h2', null, 'Παραγγελία ' + o.id), el('p', null, o.mode === 'demo' ? 'Στοιχεία δοκιμής για ' + o.email + '.' : 'Στείλαμε επιβεβαίωση στο ' + o.email + '.'), el('table', { class: 'sum' }, tbl));
      box.appendChild(ok);
      if (o.payment === 'bank') { var b = S.payments.bank; box.appendChild(el('div', { class: 'card-box', style: 'margin-top:20px' }, el('h2', null, 'Στοιχεία κατάθεσης'), el('p', null, b.bank + ' · ' + b.beneficiary), el('p', null, el('b', null, 'IBAN: '), b.iban), el('p', null, el('b', null, 'Αιτιολογία: '), o.id, ' · Ποσό: ', eur(o.price.total)))); }
      box.appendChild(el('div', { class: 'card-box', style: 'margin-top:20px' }, el('h2', null, 'Τι ακολουθεί'), el('ol', null, el('li', null, 'Ελέγχουμε το link και το σχέδιο και σε ειδοποιούμε αν χρειάζεται κάτι.'), el('li', null, o.payment === 'bank' ? 'Μόλις εισπραχθεί η πληρωμή ξεκινά η παραγωγή.' : 'Ξεκινά η παραγωγή.'), el('li', null, 'Παραγωγή: ' + S.shipping.productionDays + '. Αποστολή με ' + (S.shipping.couriers.filter(function (c) { return c.id === o.courier; })[0] || {}).name + '.'), el('li', null, o.invoice.type === 'invoice' ? 'Θα εκδοθεί τιμολόγιο στα στοιχεία που έδωσες.' : 'Θα εκδοθεί απόδειξη.'))));
    }
  }

  /* ---------- multi-store tool + forms ---------- */
  function postForm(url, payload, onOk, onFail) {
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); }).then(function (x) { if (x.j.ok) onOk(x.j); else onFail(x.j); }).catch(function () { onFail(null); });
  }
  function bindContact(form, topic) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = form, msg = form.querySelector('.form-msg'), btn = form.querySelector('button[type=submit]');
      var body = { name: f.cname.value, email: f.cemail.value, phone: f.cphone.value, company: f.ccompany ? f.ccompany.value : '', message: f.cmessage.value, consent: f.cconsent.checked, topic: topic || (f.ctopic && f.ctopic.value) || 'Γενικό', website: f.website.value };
      var e = {}; if (!V.name(body.name)) e.cname = 'Συμπλήρωσε όνομα.'; if (!V.email(body.email)) e.cemail = 'Το email δεν είναι έγκυρο.'; if (body.phone && !V.phone(body.phone)) e.cphone = 'Μη έγκυρο τηλέφωνο.'; if (body.message.trim().length < 5) e.cmessage = 'Γράψε ένα μήνυμα.'; if (!body.consent) e.cconsent = 'Χρειάζεται η συγκατάθεσή σου.';
      Array.prototype.forEach.call(f.querySelectorAll('input,textarea,select'), function (n) { if (n.name) setField(n, e[n.name] || ''); });
      if (Object.keys(e).length) { msg.textContent = 'Έλεγξε τα πεδία που σημειώθηκαν.'; return; }
      btn.disabled = true; msg.textContent = 'Αποστολή…';
      postForm('/api/contact', body, function (j) { btn.disabled = false; msg.className = 'form-msg ok-box'; msg.textContent = j.mode === 'demo' ? 'Δοκιμαστική λειτουργία: το μήνυμα δεν στάλθηκε. Γράψε μας απευθείας στο ' + (S.company.email || 'email της εταιρείας') + '.' : 'Ευχαριστούμε! Θα επικοινωνήσουμε σύντομα.'; if (j.mode !== 'demo') f.reset(); },
        function () { btn.disabled = false; msg.className = 'form-msg err'; msg.textContent = 'Δεν στάλθηκε το μήνυμα.' + (S.company.email ? ' Γράψε μας στο ' + S.company.email + '.' : ''); });
    });
  }
  if (page === 'contact') bindContact($('contact'));
  if (page === 'business') {
    bindContact($('quote'), 'Προσφορά');
    S.colors.forEach(function (c) { $('ml-color').appendChild(el('option', { value: c.id }, c.name)); });
    S.products.forEach(function (p) { $('ml-sku').appendChild(el('option', { value: p.sku }, p.name)); });
    function parse() {
      var rows = [], re = /https?:\/\/\S+/i;
      $('ml-text').value.split(/\r?\n/).forEach(function (line) {
        if (!line.trim()) return; var m = line.match(re), link = m ? m[0].replace(/[,;|]+$/, '') : '', name = line.replace(re, '').replace(/^[\s|;,\t]+|[\s|;,\t]+$/g, '');
        var d = link ? D.diagnose(link) : { ok: false, tag: 'Λείπει link', cls: 'bad' }; var okName = V.name(name) && name.length <= 40;
        rows.push({ name: name, link: link, ok: d.ok && okName && !(d.sample && !S.demo) && V.httpsUrl(link), d: d, okName: okName });
      });
      return rows;
    }
    function drawML() {
      var rows = parse(), tb = $('ml-table').tBodies[0]; tb.textContent = '';
      rows.forEach(function (r, i) { tb.appendChild(el('tr', null, el('td', null, i + 1), el('td', null, r.name || '—'), el('td', { class: r.ok ? 'ok' : 'bad' }, !r.okName ? 'Όνομα 2–40 χαρ.' : (r.d.tag || '') + (r.d.cls === 'warn' ? ' ⚠' : '')))); });
      var bad = rows.filter(function (r) { return !r.ok; }).length, over = rows.length > 50;
      $('ml-msg').textContent = !rows.length ? 'Γράψε ένα κατάστημα ανά γραμμή.' : over ? 'Έως 50 καταστήματα ανά παραγγελία.' : bad ? bad + ' γραμμές χρειάζονται διόρθωση.' : rows.length + ' καταστήματα έτοιμα.';
      $('ml-add').disabled = !rows.length || bad || over; return rows;
    }
    ['ml-text'].forEach(function (id) { $(id).addEventListener('input', drawML); });
    $('ml-add').addEventListener('click', function () {
      var rows = drawML(), qty = Math.max(1, parseInt($('ml-qty').value, 10) || 1);
      rows.forEach(function (r) { Cart.add({ sku: $('ml-sku').value, qty: qty, design: { name: r.name, link: r.link, color: $('ml-color').value } }); });
      A.toast(rows.length + ' γραμμές προστέθηκαν στο καλάθι.', '/kalathi', 'Δες το καλάθι ›');
    });
    drawML();
  }
})();
