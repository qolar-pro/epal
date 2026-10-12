(function () {
  'use strict';
  var S = window.STORE, $ = function (id) { return document.getElementById(id); };
  var eur = new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' });
  var num = function (x, d) { return Number(x).toLocaleString('el-GR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  function el(tag, attrs) {
    var e = document.createElement(tag);
    for (var k in (attrs || {})) e.setAttribute(k, attrs[k]);
    for (var i = 2; i < arguments.length; i++) if (arguments[i] != null) e.appendChild(typeof arguments[i] === 'string' ? document.createTextNode(arguments[i]) : arguments[i]);
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  $('brandName').textContent = S.brand; $('footBrand').textContent = S.brand;
  $('footContact').textContent = [S.email, S.phone].filter(Boolean).join(' · ') || 'Επικοινωνία μέσω της φόρμας παραγγελίας';

  /* ---------- colour helpers ---------- */
  function lum(hex) {
    var c = [1, 3, 5].map(function (i) { var v = parseInt(hex.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function textOn(bg) { return ratio('#ffffff', bg) >= ratio('#111111', bg) ? '#ffffff' : '#111111'; }

  /* ---------- link doctor ---------- */
  function diagnose(raw) {
    var u;
    try { u = new URL(raw); } catch (e) { return { cls: 'bad', tag: 'Άκυρο', text: 'Δεν είναι έγκυρο link. Πρέπει να ξεκινά με https://', ok: false }; }
    if (u.protocol !== 'https:') return { cls: 'bad', tag: 'Άκυρο', text: 'Χρησιμοποίησε https:// (ασφαλές link).', ok: false };
    var h = u.hostname.replace(/^www\./, ''), path = u.pathname;
    if (/EXAMPLE|YOUR_|ΤΟ_PLACE/i.test(raw)) return { cls: 'warn', tag: 'Παράδειγμα', text: 'Αυτό είναι δείγμα. Βάλε το δικό σου link ή Place ID πριν παραγγείλεις.', ok: true };
    if (h === 'g.page' && /\/r\/.+\/review\/?$/.test(path)) return { cls: 'ok', tag: 'Σωστό', text: 'Link κριτικής g.page: ανοίγει κατευθείαν τη φόρμα κριτικής.', ok: true };
    if (h === 'search.google.com' && /\/local\/writereview/.test(path) && u.searchParams.get('placeid')) return { cls: 'ok', tag: 'Σωστό', text: 'Link με Place ID: ανοίγει κατευθείαν τη φόρμα κριτικής.', ok: true };
    if (h === 'g.page') return { cls: 'warn', tag: 'Προσοχή', text: 'Αυτό το g.page ανοίγει το προφίλ, όχι τη φόρμα. Ψάξε στο προφίλ σου το link «Ζήτα κριτικές» (τελειώνει σε /review).', ok: true };
    if (h === 'maps.app.goo.gl' || h === 'goo.gl' || /^google\.[a-z.]+$/.test(h) && /\/maps/.test(path)) return { cls: 'warn', tag: 'Προσοχή', text: 'Αυτό είναι link χάρτη: ανοίγει το κατάστημα, όχι τη φόρμα κριτικής. Ο πελάτης θα πρέπει να ψάξει.', ok: true };
    if (h === 'g.co') return { cls: 'warn', tag: 'Προσοχή', text: 'Το g.co/kgs ανοίγει το αποτέλεσμα αναζήτησης, όχι τη φόρμα κριτικής.', ok: true };
    return { cls: 'warn', tag: 'Άγνωστο', text: 'Δεν αναγνωρίζεται ως link κριτικής Google. Δοκίμασέ το στο κινητό σου πριν παραγγείλεις. (Αν είναι δικό σου σύντομο link που ανακατευθύνει, είναι ΟΚ.)', ok: true };
  }

  /* ---------- card SVG ---------- */
  var THEMES = [['Μελάνι', '#151515'], ['Πεύκο', '#0f3d2e'], ['Βερμίλιο', '#e8431a'], ['Ναυτικό', '#0b1f3a'], ['Κρεμ', '#f3efe6'], ['Κρασί', '#6b1d34']];
  var D = { link: '', name: '', cta: '', color: '#151515', size: 26, ecl: 'M' };
  function star(cx, cy, R) { var p = []; for (var i = 0; i < 10; i++) { var r = i % 2 ? R * 0.4 : R, a = -Math.PI / 2 + i * Math.PI / 5; p.push((cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2)); } return 'M' + p.join('L') + 'Z'; }
  function wrap(text, max) {
    var words = text.trim().split(/\s+/), lines = [], cur = '';
    words.forEach(function (w) {
      while (w.length > max) { if (cur) { lines.push(cur); cur = ''; } lines.push(w.slice(0, max)); w = w.slice(max); }
      if ((cur + ' ' + w).trim().length > max) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    });
    if (cur) lines.push(cur);
    return lines.filter(Boolean);
  }
  function qrFor(link) { return window.QR.encode(link, D.ecl); }
  function cardSvg(print) {
    var W = 85.6, H = 54, b = print ? 3 : 0, fg = textOn(D.color), q = qrFor(D.link), side = D.size, m = side / (q.size + 8);
    var px = b + W - 5 - side, py = b + (H - side) / 2, aw = px - (b + 5) - 4, fs = 5.6, lines;
    do { lines = wrap(D.name || ' ', Math.floor(aw / (fs * 0.58))); } while (lines.length > 3 && (fs -= 0.4) > 3.2);
    var starC = fg === '#ffffff' ? '#ffc233' : '#c2410c', d = [];
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.modules[y][x]) d.push('M' + (px + (x + 4) * m).toFixed(3) + ',' + (py + (y + 4) * m).toFixed(3) + 'h' + m.toFixed(3) + 'v' + m.toFixed(3) + 'h-' + m.toFixed(3) + 'z');
    var tot = [W + 2 * b, H + 2 * b], s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + tot[0] + ' ' + tot[1] + '"' + (print ? ' width="' + tot[0] + 'mm" height="' + tot[1] + 'mm"' : ' role="img" aria-label="Προεπισκόπηση κάρτας"') + '>';
    if (!print) s += '<defs><clipPath id="cp"><rect width="' + W + '" height="' + H + '" rx="3.2"/></clipPath></defs><g clip-path="url(#cp)">';
    s += '<rect width="' + tot[0] + '" height="' + tot[1] + '" fill="' + D.color + '"/>';
    for (var i = 0; i < 5; i++) s += '<path d="' + star(b + 7.2 + i * 5.2, b + 9.5, 2.2) + '" fill="' + starC + '"/>';
    lines.forEach(function (l, i) { s += '<text x="' + (b + 5) + '" y="' + (b + 19 + fs * 1.08 * (i + 1)).toFixed(2) + '" font-size="' + fs.toFixed(2) + '" font-weight="700" fill="' + fg + '" font-family="\'Iowan Old Style\',\'Palatino Linotype\',Georgia,serif">' + esc(l) + '</text>'; });
    s += '<text x="' + (b + 5) + '" y="' + (b + H - 10) + '" font-size="3.1" font-weight="600" fill="' + fg + '" font-family="\'Segoe UI\',Arial,sans-serif">' + esc(D.cta) + '</text>';
    s += '<text x="' + (b + 5) + '" y="' + (b + H - 5.5) + '" font-size="2.2" letter-spacing=".25" fill="' + fg + '" opacity=".75" font-family="\'Segoe UI\',Arial,sans-serif">ΑΓΓΙΞΕ Ή ΣΚΑΝΑΡΕ</text>';
    s += '<rect x="' + px + '" y="' + py + '" width="' + side + '" height="' + side + '" rx="1.2" fill="#fff"/><path d="' + d.join('') + '" fill="#111"/>';
    return s + (print ? '' : '</g>') + '</svg>';
  }

  function updateDesign() {
    var diag = diagnose($('d-link').value.trim()), doc = $('linkDoctor');
    doc.className = 'doctor ' + diag.cls; doc.textContent = ''; doc.appendChild(el('b', null, diag.tag + ' ')); doc.appendChild(document.createTextNode(diag.text));
    var out = $('cardOut'), mt = $('metrics'), vd = $('qrVerdict');
    if (!diag.ok) { out.textContent = ''; mt.textContent = ''; vd.textContent = ''; vd.className = 'verdict'; $('dlCard').disabled = $('dlQr').disabled = true; return; }
    $('d-size-o').textContent = $('d-size').value;
    D.link = $('d-link').value.trim(); D.name = $('d-name').value; D.cta = $('d-cta').value; D.size = +$('d-size').value; D.ecl = $('d-ecl').value; D.color = $('d-color').value;
    try {
      var q = qrFor(D.link), m = D.size / (q.size + 8), cr = ratio(textOn(D.color), D.color);
      out.innerHTML = cardSvg(false); $('heroQr').innerHTML = qrOnlySvg(q);
      mt.textContent = '';
      [['Έκδοση QR', q.version], ['Τετραγωνάκια', q.size + '×' + q.size], ['Byte', q.bytes], ['Τετραγωνάκι', num(m, 2) + ' mm'], ['Αντίθεση κειμένου', num(cr, 1) + ' : 1']].forEach(function (x) { mt.appendChild(el('div', null, el('dt', null, x[0]), el('dd', null, String(x[1])))); });
      var msg, cls;
      if (m >= 0.5) { cls = 'ok'; msg = 'Μέγεθος QR: άριστο. Διαβάζεται εύκολα.'; }
      else if (m >= 0.35) { cls = 'ok'; msg = 'Μέγεθος QR: αρκετό. Για πιο άνετη σάρωση μεγάλωσε το QR ή μίκρυνε το link.'; }
      else { cls = 'bad'; msg = 'Το QR είναι πολύ πυκνό για αυτό το μέγεθος. Μεγάλωσε το ή μίκρυνε το link, αλλιώς θα δυσκολεύει τη σάρωση.'; }
      if (cr < 4.5) { cls = cls === 'bad' ? 'bad' : 'warn'; msg += ' Προσοχή: το κείμενο έχει χαμηλή αντίθεση με αυτό το χρώμα.'; }
      vd.className = 'verdict ' + cls; vd.textContent = msg + ' (Κανόνας: καλύτερα από 0,35 mm ανά τετραγωνάκι.)';
      $('dlCard').disabled = $('dlQr').disabled = false;
    } catch (e) { out.textContent = ''; vd.className = 'verdict bad'; vd.textContent = e.message; $('dlCard').disabled = $('dlQr').disabled = true; }
    store('asteri.design', { link: D.link, name: D.name, cta: D.cta, color: D.color, size: D.size, ecl: D.ecl });
  }
  function qrOnlySvg(q) {
    var d = [], n = q.size + 2;
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.modules[y][x]) d.push('M' + (x + 1) + ',' + (y + 1) + 'h1v1h-1z');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges"><path d="' + d.join('') + '" fill="#111"/></svg>';
  }
  function download(name, text) {
    var a = el('a', { href: URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' })), download: name });
    document.body.appendChild(a); a.click(); a.remove();
  }
  THEMES.forEach(function (t) {
    var b = el('button', { type: 'button', class: 'swatch', title: t[0], 'aria-label': t[0], 'aria-pressed': 'false', style: 'background:' + t[1] });
    b.addEventListener('click', function () { $('d-color').value = t[1]; updateDesign(); sync(); });
    $('swatches').appendChild(b);
  });
  function sync() { Array.prototype.forEach.call($('swatches').children, function (b, i) { b.setAttribute('aria-pressed', THEMES[i][1] === $('d-color').value ? 'true' : 'false'); }); }
  var saved = store('asteri.design');
  if (saved) { if (saved.link) $('d-link').value = saved.link; $('d-name').value = saved.name != null ? saved.name : $('d-name').value; $('d-cta').value = saved.cta != null ? saved.cta : $('d-cta').value; if (/^#[0-9a-f]{6}$/i.test(saved.color || '')) $('d-color').value = saved.color; if (saved.size) $('d-size').value = saved.size; if (saved.ecl) $('d-ecl').value = saved.ecl; }
  ['d-link', 'd-name', 'd-cta', 'd-color', 'd-size', 'd-ecl'].forEach(function (id) { $(id).addEventListener('input', function () { updateDesign(); sync(); }); });
  $('designForm').addEventListener('submit', function (e) { e.preventDefault(); });
  $('dlCard').addEventListener('click', function () { download('karta-kritikis-print.svg', cardSvg(true)); });
  $('dlQr').addEventListener('click', function () { download('qr-kritikis.svg', window.QR.toSvg(D.link, { ecl: D.ecl, border: 4 }).svg); });
  updateDesign(); sync();

  /* ---------- rating math ---------- */
  function mathUpdate() {
    var R = +$('m-r').value, N = +$('m-n').value, C = +$('m-c').value, P = +$('m-p').value, s = +$('m-s').value, T = +$('m-t').value, out = $('mathOut');
    out.textContent = '';
    if (!(R >= 1 && R <= 5 && N >= 0 && C > 0 && P > 0 && s >= 1 && s <= 5)) { out.appendChild(el('p', { class: 'err' }, 'Έλεγξε τα νούμερα: βαθμολογίες 1–5, ποσοστό και πελάτες θετικά.')); return; }
    var k = C * 4.33 * P / 100, avg = function (months) { return (R * N + s * k * months) / (N + k * months); };
    var big = el('p', { class: 'bignum' }, '≈ ' + num(k, 1) + ' νέες κριτικές / μήνα');
    big.appendChild(el('small', null, 'από ' + num(C) + ' πελάτες/εβδομάδα × ' + num(P, 1) + '% (' + num(C * 4.33, 0) + ' πελάτες/μήνα)'));
    out.appendChild(big);
    var tb = el('tbody');
    [1, 3, 6, 12].forEach(function (mo) {
      var a = avg(mo);
      tb.appendChild(el('tr', null, el('td', null, mo + (mo === 1 ? ' μήνας' : ' μήνες')), el('td', null, num(N + k * mo, 0)), el('td', { class: a > R ? 'up' : '' }, num(a, 2))));
    });
    out.appendChild(el('table', null, el('thead', null, el('tr', null, el('th', null, 'Μετά από'), el('th', null, 'Σύνολο κριτικών'), el('th', null, 'Βαθμολογία'))), tb));
    var note;
    if (T <= R) note = 'Έχεις ήδη τον στόχο των ' + num(T, 1) + '.';
    else if (s <= T) note = 'Ο μέσος των νέων κριτικών (' + num(s, 1) + ') δεν είναι πάνω από τον στόχο (' + num(T, 1) + '): δεν θα τον φτάσεις με αυτό το μέσο όρο.';
    else { var need = Math.ceil(N * (T - R) / (s - T)); note = 'Για να φτάσεις ' + num(T, 1) + ' χρειάζονται περίπου ' + num(need) + ' νέες κριτικές, δηλαδή ' + num(Math.ceil(need / k)) + ' μήνες με αυτό τον ρυθμό.'; }
    out.appendChild(el('p', { class: 'verdict' }, note));
  }
  Array.prototype.forEach.call($('mathForm').elements, function (f) { f.addEventListener('input', mathUpdate); });
  $('mathForm').addEventListener('submit', function (e) { e.preventDefault(); }); mathUpdate();

  /* ---------- checklist ---------- */
  var items = ['Δοκίμασα το link στο κινητό μου', 'Ενημέρωσα την ομάδα για τους κανόνες της Google', 'Αποφάσισα πού θα βρίσκονται οι κάρτες', 'Έβαλα στόχο: πόσους πελάτες θα ρωτάω κάθε μέρα', 'Θα απαντάω σε κάθε νέα κριτική'];
  var ck = store('asteri.check') || {};
  items.forEach(function (t, i) {
    var cb = el('input', { type: 'checkbox', id: 'ck' + i }); cb.checked = !!ck[i];
    cb.addEventListener('change', function () { ck[i] = cb.checked; store('asteri.check', ck); });
    $('checklist').appendChild(el('li', null, cb, el('label', { for: 'ck' + i }, t)));
  });

  /* ---------- products + order ---------- */
  S.products.forEach(function (p) {
    $('o-product').appendChild(el('option', { value: p.id }, p.name));
    var b = el('button', { type: 'button', class: 'btn' }, 'Επιλογή');
    b.addEventListener('click', function () { $('o-product').value = p.id; calc(); $('o-qty').focus(); });
    $('productGrid').appendChild(el('article', { class: 'product' }, el('h3', null, p.name), el('p', null, p.desc), el('p', { class: 'price' }, 'από ', el('strong', null, eur.format(p.price)), ' / τεμ. + ΦΠΑ'), b));
  });
  function tier(q) { var t = S.discounts[0]; S.discounts.forEach(function (d) { if (q >= d.min) t = d; }); return t; }
  function compute() {
    var p = S.products.filter(function (x) { return x.id === $('o-product').value; })[0], q = parseInt($('o-qty').value, 10);
    if (!p || !(q >= 1)) return null;
    var unit = Math.round(p.price * 100), sub = unit * q, t = tier(q), disc = Math.round(sub * t.rate), net = sub - disc;
    var ship = net >= S.freeShippingFrom * 100 ? 0 : Math.round(S.shipping * 100), base = net + ship, vat = Math.round(base * S.vatRate);
    return { p: p, q: q, unit: unit, sub: sub, rate: t.rate, disc: disc, ship: ship, vat: vat, total: base + vat };
  }
  function c(x) { return eur.format(x / 100); }
  function calc() {
    var r = compute(), tb = $('sumTable').tBodies[0]; tb.textContent = '';
    if (!r) { $('sumFormula').textContent = 'Βάλε ποσότητα 1 ή περισσότερα.'; return null; }
    [['Προϊόν', r.p.name], ['Τιμή τεμαχίου', c(r.unit)], ['Ποσότητα', String(r.q)], ['Υποσύνολο', c(r.sub)], ['Έκπτωση ποσότητας (' + Math.round(r.rate * 100) + '%)', r.disc ? '−' + c(r.disc) : '—'], ['Μεταφορικά', r.ship ? c(r.ship) : 'Δωρεάν'], ['ΦΠΑ ' + Math.round(S.vatRate * 100) + '%', c(r.vat)], ['Σύνολο', c(r.total)]].forEach(function (x, i, a) {
      tb.appendChild(el('tr', i === a.length - 1 ? { class: 'total' } : null, el('th', { scope: 'row' }, x[0]), el('td', null, x[1])));
    });
    $('sumFormula').textContent = 'Σύνολο = (' + c(r.sub) + ' − ' + c(r.disc) + ' + ' + (r.ship ? c(r.ship) : '0') + ') × ' + (1 + S.vatRate).toFixed(2) + ' = ' + c(r.total);
    return r;
  }
  $('o-product').addEventListener('change', calc); $('o-qty').addEventListener('input', calc); calc();

  $('orderForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var g = function (id) { return $(id).value.trim(); }, msg = $('orderMsg'), res = $('orderResult'), r = calc();
    msg.textContent = ''; res.textContent = '';
    if (!r) msg.textContent = 'Έλεγξε την ποσότητα.';
    else if (!g('o-biz') || !g('o-name') || !g('o-email')) msg.textContent = 'Συμπλήρωσε επωνυμία, ονοματεπώνυμο και email.';
    else if (!$('o-email').checkValidity()) msg.textContent = 'Το email δεν φαίνεται σωστό.';
    else if (g('o-tel') && !$('o-tel').checkValidity()) msg.textContent = 'Το τηλέφωνο πρέπει να έχει 8–20 ψηφία.';
    else if (!$('o-consent').checked) msg.textContent = 'Χρειάζεται η συγκατάθεσή σου για να προχωρήσουμε.';
    if (msg.textContent) return;
    var dg = diagnose(D.link || '');
    var body = ['Παραγγελία ' + S.brand, '', 'Προϊόν: ' + r.p.name, 'Ποσότητα: ' + r.q, 'Σύνολο (με ΦΠΑ): ' + c(r.total), '',
      'Επωνυμία: ' + g('o-biz'), 'Όνομα: ' + g('o-name'), 'Email: ' + g('o-email'), 'Τηλέφωνο: ' + g('o-tel'), 'Σημειώσεις: ' + g('o-notes'), '',
      'Σχεδιασμός κάρτας', '  Όνομα στην κάρτα: ' + D.name, '  Κείμενο πρόσκλησης: ' + D.cta, '  Χρώμα: ' + D.color, '  Μέγεθος QR: ' + D.size + ' mm (διόρθωση ' + D.ecl + ')',
      '  Link κριτικής: ' + D.link + '  [' + dg.tag + ']'].join('\n');
    var ta = el('textarea', { readonly: '', rows: '12', 'aria-label': 'Κείμενο παραγγελίας' }); ta.value = body;
    var copy = el('button', { type: 'button', class: 'btn' }, 'Αντιγραφή');
    copy.addEventListener('click', function () { ta.select(); (navigator.clipboard ? navigator.clipboard.writeText(body) : Promise.reject()).then(function () { copy.textContent = 'Αντιγράφηκε'; }, function () { document.execCommand('copy'); copy.textContent = 'Αντιγράφηκε'; }); });
    res.appendChild(el('p', null, S.email ? 'Έτοιμο. Πάτα «Άνοιγμα email» και στείλε το μήνυμα.' : 'Έτοιμο. Αντίγραψε το κείμενο και στείλε το στον πωλητή. Μην ξεχάσεις να επισυνάψεις το αρχείο SVG της κάρτας.'));
    res.appendChild(ta);
    var row = el('p', { class: 'actions' }, copy);
    if (S.email) row.appendChild(el('a', { class: 'btn solid', href: 'mailto:' + S.email + '?subject=' + encodeURIComponent('Παραγγελία ' + S.brand) + '&body=' + encodeURIComponent(body) }, 'Άνοιγμα email'));
    res.appendChild(row);
  });
})();
