(function () {
  'use strict';
  var S = window.STORE, $ = function (id) { return document.getElementById(id); };
  var eur = new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' });
  function el(tag, attrs) {
    var e = document.createElement(tag);
    for (var k in (attrs || {})) e.setAttribute(k, attrs[k]);
    for (var i = 2; i < arguments.length; i++) e.appendChild(typeof arguments[i] === 'string' ? document.createTextNode(arguments[i]) : arguments[i]);
    return e;
  }

  /* brand + contact */
  $('brandName').textContent = S.brand; $('footBrand').textContent = S.brand;
  $('footContact').textContent = [S.email, S.phone].filter(Boolean).join(' · ') || 'Επικοινωνία μέσω της φόρμας παραγγελίας';

  /* products */
  S.products.forEach(function (p) {
    $('product').appendChild(el('option', { value: p.id }, p.name));
    var btn = el('button', { type: 'button', class: 'btn' }, 'Επιλογή');
    btn.addEventListener('click', function () { $('product').value = p.id; calc(); $('paraggelia').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
    $('productGrid').appendChild(el('article', { class: 'product' },
      el('h3', null, p.name), el('p', null, p.desc),
      el('p', { class: 'price' }, 'από ', el('strong', null, eur.format(p.price)), ' / τεμ. + ΦΠΑ'), btn));
  });

  /* QR demo */
  var lastSvg = '';
  function renderQr() {
    var url = $('reviewUrl').value.trim(), msg = $('qrMsg');
    msg.textContent = '';
    if (!/^https?:\/\/\S+$/i.test(url)) { msg.textContent = 'Βάλε ένα έγκυρο link που ξεκινά με https://'; return; }
    try {
      var r = window.QR.toSvg(url, { ecl: $('ecl').value, dark: '#0b1f3a' });
      lastSvg = r.svg; $('qrOut').innerHTML = r.svg; $('heroQr').innerHTML = r.svg;
      var f = $('qrFacts'); f.textContent = '';
      [['Χαρακτήρες', url.length], ['Byte (UTF-8)', r.info.bytes], ['Έκδοση QR', r.info.version],
       ['Μέγεθος', r.info.size + '×' + r.info.size + ' τετραγωνάκια'], ['Διόρθωση', r.info.ecl]].forEach(function (x) {
        f.appendChild(el('div', null, el('dt', null, x[0]), el('dd', null, String(x[1]))));
      });
    } catch (e) { msg.textContent = e.message; }
  }
  $('reviewUrl').addEventListener('input', renderQr); $('ecl').addEventListener('change', renderQr);
  $('qrForm').addEventListener('submit', function (e) { e.preventDefault(); });
  $('dlSvg').addEventListener('click', function () {
    if (!lastSvg) return;
    var a = el('a', { href: URL.createObjectURL(new Blob([lastSvg], { type: 'image/svg+xml' })), download: 'qr-kritiki.svg' });
    document.body.appendChild(a); a.click(); a.remove();
  });
  renderQr();

  /* price calculator (integer cents, to avoid floating point drift) */
  function tier(q) { var t = S.discounts[0]; S.discounts.forEach(function (d) { if (q >= d.min) t = d; }); return t; }
  function compute() {
    var p = S.products.filter(function (x) { return x.id === $('product').value; })[0];
    var q = parseInt($('qty').value, 10);
    if (!p || !(q >= 1)) return null;
    var unit = Math.round(p.price * 100), sub = unit * q, t = tier(q);
    var disc = Math.round(sub * t.rate), net = sub - disc;
    var ship = net >= S.freeShippingFrom * 100 ? 0 : Math.round(S.shipping * 100);
    var base = net + ship, vat = Math.round(base * S.vatRate);
    return { p: p, q: q, unit: unit, sub: sub, rate: t.rate, disc: disc, net: net, ship: ship, vat: vat, total: base + vat };
  }
  function c(x) { return eur.format(x / 100); }
  function calc() {
    var r = compute(), tb = $('sumTable').tBodies[0];
    tb.textContent = '';
    if (!r) { $('sumFormula').textContent = 'Βάλε ποσότητα 1 ή περισσότερα.'; return null; }
    [['Προϊόν', r.p.name], ['Τιμή τεμαχίου', c(r.unit)], ['Ποσότητα', String(r.q)], ['Υποσύνολο', c(r.sub)],
     ['Έκπτωση ποσότητας (' + Math.round(r.rate * 100) + '%)', '−' + c(r.disc)], ['Μεταφορικά', r.ship ? c(r.ship) : 'Δωρεάν'],
     ['ΦΠΑ ' + Math.round(S.vatRate * 100) + '%', c(r.vat)], ['Σύνολο', c(r.total)]].forEach(function (x, i, a) {
      var tr = el('tr', i === a.length - 1 ? { class: 'total' } : null, el('th', { scope: 'row' }, x[0]), el('td', null, x[1]));
      tb.appendChild(tr);
    });
    $('sumFormula').textContent = 'Σύνολο = (' + c(r.sub) + ' − ' + c(r.disc) + ' + ' + (r.ship ? c(r.ship) : '0') + ') × (1 + ' + S.vatRate + ') = ' + c(r.total);
    return r;
  }
  $('product').addEventListener('change', calc); $('qty').addEventListener('input', calc); calc();

  /* order: builds a message; nothing is sent automatically */
  $('orderForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, msg = $('orderMsg'), res = $('orderResult'), r = calc();
    msg.textContent = ''; res.textContent = '';
    var bad = ['biz', 'name', 'email'].filter(function (id) { return !f[id].value.trim(); });
    if (!r) msg.textContent = 'Έλεγξε την ποσότητα.';
    else if (bad.length) msg.textContent = 'Συμπλήρωσε επωνυμία, ονοματεπώνυμο και email.';
    else if (!f.email.checkValidity()) msg.textContent = 'Το email δεν φαίνεται σωστό.';
    else if (f.tel.value && !f.tel.checkValidity()) msg.textContent = 'Το τηλέφωνο πρέπει να έχει 8–20 ψηφία.';
    else if (f.link.value && !f.link.checkValidity()) msg.textContent = 'Το link πρέπει να ξεκινά με https://';
    else if (!f.consent.checked) msg.textContent = 'Χρειάζεται η συγκατάθεσή σου για να προχωρήσουμε.';
    if (msg.textContent) return;
    var body = ['Παραγγελία ' + S.brand, '', 'Προϊόν: ' + r.p.name, 'Ποσότητα: ' + r.q, 'Σύνολο (με ΦΠΑ): ' + c(r.total), '',
      'Επωνυμία: ' + f.biz.value.trim(), 'Όνομα: ' + f.name.value.trim(), 'Email: ' + f.email.value.trim(),
      'Τηλέφωνο: ' + f.tel.value.trim(), 'Link κριτικής: ' + f.link.value.trim(), 'Σημειώσεις: ' + f.notes.value.trim()].join('\n');
    var ta = el('textarea', { readonly: '', rows: '10', 'aria-label': 'Κείμενο παραγγελίας' }); ta.value = body;
    var copy = el('button', { type: 'button', class: 'btn' }, 'Αντιγραφή');
    copy.addEventListener('click', function () {
      ta.select();
      (navigator.clipboard ? navigator.clipboard.writeText(body) : Promise.reject()).then(function () { copy.textContent = 'Αντιγράφηκε'; }, function () { document.execCommand('copy'); copy.textContent = 'Αντιγράφηκε'; });
    });
    res.appendChild(el('p', null, S.email ? 'Η παραγγελία είναι έτοιμη. Πάτα «Άνοιγμα email» και στείλε το μήνυμα.' : 'Η παραγγελία είναι έτοιμη. Αντίγραψε το κείμενο και στείλε το στον πωλητή.'));
    res.appendChild(ta);
    var row = el('p', { class: 'cta-row' }, copy);
    if (S.email) row.appendChild(el('a', { class: 'btn primary', href: 'mailto:' + S.email + '?subject=' + encodeURIComponent('Παραγγελία ' + S.brand) + '&body=' + encodeURIComponent(body) }, 'Άνοιγμα email'));
    res.appendChild(row);
  });
})();
