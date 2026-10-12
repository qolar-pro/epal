'use strict';
const assert = require('assert');
const store = require('../config.js'), P = require('../lib/pricing.js'), V = require('../lib/validate.js');
let n = 0; const t = (name, fn) => { fn(); n++; };

// --- AFM: generate valid numbers with the official algorithm and verify rejection of corrupted ones
function mkAfm(prefix8) { let s = 0; for (let i = 0; i < 8; i++) s += +prefix8[i] * 2 ** (8 - i); return prefix8 + ((s % 11) % 10); }
t('afm valid', () => { ['12345678', '09425921', '99887766', '04001234'].forEach((p) => assert(V.afm(mkAfm(p)), p)); });
t('afm invalid', () => { const a = mkAfm('12345678'); assert(!V.afm(a.slice(0, 8) + ((+a[8] + 1) % 10))); assert(!V.afm('000000000')); assert(!V.afm('12345')); assert(!V.afm('abcdefghi')); });
t('phone', () => { ['6912345678', '+30 691 234 5678', '2101234567', '0030 210 123 4567', '697-123-4567'].forEach((x) => assert(V.phone(x), x)); ['5912345678', '691234567', '21012345678', ''].forEach((x) => assert(!V.phone(x), x)); });
t('tk', () => { assert(V.tk('10431')); assert(V.tk('85100')); assert(!V.tk('00000')); assert(!V.tk('9xxxx')); assert(!V.tk('1043')); });
t('url', () => { assert(V.httpsUrl('https://g.page/r/abc/review')); assert(!V.httpsUrl('http://x.gr')); assert(!V.httpsUrl('javascript:alert(1)')); assert(!V.httpsUrl('https://localhost')); });

// --- pricing: hand-computed cases (cents)
t('pricing basic', () => {
  const r = P.price(store, [{ sku: 'card', qty: 1 }], { courier: 'acs', island: false, payment: 'bank' });
  assert.strictEqual(r.net, 690); assert.strictEqual(r.shipping, 390); assert.strictEqual(r.taxable, 1080); assert.strictEqual(r.vat, 259); assert.strictEqual(r.total, 1339);
});
t('pricing tier + free shipping', () => {
  const r = P.price(store, [{ sku: 'card', qty: 50 }], { courier: 'acs', payment: 'bank' });   // unit 690 -20% = 552 ; net 27600 ; free ship ; vat 6624
  assert.strictEqual(r.lines[0].unitNet, 552); assert.strictEqual(r.net, 27600); assert.strictEqual(r.shipping, 0); assert.strictEqual(r.vat, 6624); assert.strictEqual(r.total, 34224);
});
t('pricing tier uses total SKU qty across lines', () => {
  const r = P.price(store, [{ sku: 'card', qty: 10 }, { sku: 'card', qty: 15 }], { courier: 'elta', payment: 'bank' });  // total 25 -> 15%
  assert.strictEqual(r.lines[0].rate, 0.15); assert.strictEqual(r.lines[1].rate, 0.15); assert.strictEqual(r.lines[0].unitNet, 587);
});
t('pricing islands + COD', () => {
  const r = P.price(store, [{ sku: 'sticker', qty: 2 }], { courier: 'speedex', island: true, payment: 'cod' });   // net 1900 + 720 + 200 = 2820 ; vat 677 (676.8) ; total 3497
  assert.strictEqual(r.shipping, 720); assert.strictEqual(r.codFee, 200); assert.strictEqual(r.vat, 677); assert.strictEqual(r.total, 3497);
});
t('pricing rejects bad lines', () => { assert(P.price(store, [{ sku: 'nope', qty: 1 }], {}).errors.length); assert(P.price(store, [{ sku: 'card', qty: 0.5 }], {}).errors.length); assert(P.price(store, [{ sku: 'card', qty: -3 }], {}).errors.length); });

// --- API with mocked fetch and fake req/res
const order = require('../api/order.js');
const mkRes = () => { const r = { headers: {}, setHeader(k, v) { r.headers[k] = v; }, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; } }; return r; };
const good = () => ({ customer: { name: 'Μαρία Παπαδοπούλου', email: 'm@example.gr', phone: '6912345678' }, shipping: { address: 'Ερμού 10', tk: '10563', city: 'Αθήνα', region: 'Αττική', island: false },
  courier: 'acs', payment: 'bank', invoice: { type: 'invoice', company: 'Καφέ ΙΚΕ', afm: mkAfm('12345678'), doy: 'Α΄ Αθηνών', activity: 'Εστίαση' }, acceptTerms: true,
  lines: [{ sku: 'card', qty: 25, design: { name: 'Καφέ <b>Αστέρι</b>', link: 'https://g.page/r/abc/review', color: 'pine' } }] });
(async () => {
  let r = mkRes(); await order({ method: 'GET' }, r); assert.strictEqual(r.code, 405);
  r = mkRes(); await order({ method: 'POST', body: good() }, r); assert.strictEqual(r.code, 200); assert.strictEqual(r.body.mode, 'demo');
  assert.strictEqual(r.body.price.total, P.price(store, [{ sku: 'card', qty: 25 }], { courier: 'acs', payment: 'bank' }).total);
  const bad = good(); bad.invoice.afm = '123456789'; bad.customer.phone = '123'; bad.lines[0].design.link = 'http://x.gr'; bad.total = 1; bad.payment = 'card';
  r = mkRes(); await order({ method: 'POST', body: bad }, r); assert.strictEqual(r.code, 422); ['afm', 'phone', 'line0', 'payment'].forEach((k) => assert(r.body.errors[k], k));
  const tamper = good(); tamper.lines[0].sku = 'hack'; r = mkRes(); await order({ method: 'POST', body: tamper }, r); assert.strictEqual(r.code, 422);
  const hp = good(); hp.website = 'http://spam'; r = mkRes(); await order({ method: 'POST', body: hp }, r); assert.strictEqual(r.body.orderId, 'AST-IGNORED');
  // live mode with mocked mail + stripe
  process.env.RESEND_API_KEY = 'k'; process.env.ORDER_EMAIL_TO = 'owner@example.gr'; process.env.STRIPE_SECRET_KEY = 'sk';
  const calls = []; global.fetch = async (url, init) => { calls.push({ url, body: String(init.body) }); return { ok: true, status: 200, json: async () => ({ url: 'https://checkout.stripe.test/s1' }) }; };
  r = mkRes(); await order({ method: 'POST', body: good() }, r); assert.strictEqual(r.body.mode, 'live'); assert.strictEqual(calls.length, 2);
  assert(calls[0].body.includes('&lt;b&gt;'), 'html in design name must be escaped'); assert(!calls[0].body.includes('<b>Αστέρι'));
  store.payments.card.enabled = true; calls.length = 0; const cg = good(); cg.payment = 'card';
  r = mkRes(); await order({ method: 'POST', body: cg, headers: { host: 'x' } }, r); assert.strictEqual(r.body.paymentUrl, 'https://checkout.stripe.test/s1');
  assert(calls[0].url.includes('stripe.com') && calls[0].body.includes('unit_amount') && calls[0].body.includes('customer_email'));
  global.fetch = async () => ({ ok: false, status: 500, json: async () => ({}) }); r = mkRes(); await order({ method: 'POST', body: good() }, r); assert.strictEqual(r.code, 502);
  n += 8; console.log('all ' + n + ' checks passed');
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
