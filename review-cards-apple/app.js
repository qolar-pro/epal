(function () {
  'use strict';
  var S = window.STORE, $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var eur = new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' });
  var nf = function (x, d) { return Number(x).toLocaleString('el-GR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  function el(tag, attrs) {
    var e = document.createElement(tag);
    for (var k in (attrs || {})) e.setAttribute(k, attrs[k]);
    for (var i = 2; i < arguments.length; i++) if (arguments[i] != null) e.appendChild(typeof arguments[i] === 'string' ? document.createTextNode(arguments[i]) : arguments[i]);
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  $('brandName').textContent = S.brand; $('footBrand').textContent = S.brand;
  $('footContact').textContent = [S.email, S.phone].filter(Boolean).join(' · ') || 'Επικοινωνία μέσω της φόρμας παραγγελίας';
  $('fromPrice').textContent = eur.format(Math.min.apply(null, S.products.map(function (p) { return p.price; })));

  /* ---- colour ---- */
  function lum(hex) { var c = [1, 3, 5].map(function (i) { var v = parseInt(hex.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function textOn(bg) { var l = lum(bg); return (1.05 / (l + 0.05)) >= ((l + 0.05) / 0.0585) ? '#ffffff' : '#111111'; }

  /* ---- state ---- */
  var st = { color: 0, name: 'Καφέ Αστέρι', link: '', qr: null, prod: S.products[0].id, qty: 25 };
  function qrSvg(q) {
    var d = [], n = q.size + 2;
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.modules[y][x]) d.push('M' + (x + 1) + ',' + (y + 1) + 'h1v1h-1z');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges" role="img" aria-label="QR κωδικός"><path d="' + d.join('') + '" fill="#111"/></svg>';
  }
  function paintCard(node) {
    var hex = S.colors[st.color].hex, fg = textOn(hex);
    node.style.setProperty('--bg', hex); node.style.setProperty('--fg', fg); node.style.setProperty('--star', fg === '#ffffff' ? '#ffc233' : '#c2410c');
    node.innerHTML = '<div class="c-in"><div class="c-stars" aria-hidden="true">★★★★★</div><div class="c-name">' + esc(st.name || S.brand) + '</div><div class="c-cta">Άγγιξε ή σκάναρε</div></div>' +
      '<div class="c-qr">' + (st.qr ? qrSvg(st.qr) : '') + '</div><div class="sheen"></div>';
  }
  function repaint() {
    ['heroCard', 'colorCard'].forEach(function (id) { paintCard($(id)); });
    var bc = $('bagCard'); bc.textContent = ''; var cc = el('div', { class: 'card3d', 'aria-hidden': 'true' }); bc.appendChild(cc); cc.style.fontSize = '9px'; paintCard(cc);
    $('heroName').textContent = S.brand; $('colorName').textContent = S.colors[st.color].name;
    $('tileQr').innerHTML = st.qr ? qrSvg(st.qr) : '';
  }

  /* ---- link doctor ---- */
  function diagnose(raw) {
    var u; try { u = new URL(raw); } catch (e) { return { cls: 'bad', tag: 'Άκυρο', text: 'Δεν είναι έγκυρο link. Πρέπει να ξεκινά με https://', ok: false }; }
    if (u.protocol !== 'https:') return { cls: 'bad', tag: 'Άκυρο', text: 'Χρησιμοποίησε https:// (ασφαλές link).', ok: false };
    var h = u.hostname.replace(/^www\./, ''), p = u.pathname;
    if (/EXAMPLE|YOUR_/i.test(raw)) return { cls: 'warn', tag: 'Παράδειγμα', text: 'Δείγμα. Βάλε το δικό σου link ή Place ID πριν παραγγείλεις.', ok: true };
    if (h === 'g.page' && /\/r\/.+\/review\/?$/.test(p)) return { cls: 'ok', tag: 'Σωστό', text: 'Ανοίγει κατευθείαν τη φόρμα κριτικής.', ok: true };
    if (h === 'search.google.com' && /\/local\/writereview/.test(p) && u.searchParams.get('placeid')) return { cls: 'ok', tag: 'Σωστό', text: 'Link με Place ID: ανοίγει κατευθείαν τη φόρμα κριτικής.', ok: true };
    if (h === 'g.page') return { cls: 'warn', tag: 'Προσοχή', text: 'Ανοίγει το προφίλ, όχι τη φόρμα. Ψάξε το link «Ζήτα κριτικές» (τελειώνει σε /review).', ok: true };
    if (h === 'maps.app.goo.gl' || h === 'goo.gl' || (/^google\.[a-z.]+$/.test(h) && /\/maps/.test(p))) return { cls: 'warn', tag: 'Προσοχή', text: 'Link χάρτη: ανοίγει το κατάστημα, όχι τη φόρμα κριτικής.', ok: true };
    if (h === 'g.co') return { cls: 'warn', tag: 'Προσοχή', text: 'Το g.co/kgs ανοίγει αποτέλεσμα αναζήτησης, όχι τη φόρμα κριτικής.', ok: true };
    return { cls: 'warn', tag: 'Άγνωστο', text: 'Δεν αναγνωρίζεται ως link κριτικής Google. Δοκίμασέ το στο κινητό σου πριν παραγγείλεις.', ok: true };
  }
  function updateDesign() {
    st.name = $('d-name').value; st.link = $('d-link').value.trim();
    var d = diagnose(st.link), box = $('linkDoctor'); box.className = 'doctor ' + d.cls; box.textContent = '';
    box.appendChild(el('b', { class: d.cls }, d.tag + ' ')); box.appendChild(document.createTextNode(d.text));
    st.qr = null;
    if (d.ok) { try { st.qr = window.QR.encode(st.link, 'M'); } catch (e) { box.className = 'doctor bad'; box.textContent = e.message; } }
    repaint();
  }
  ['d-name', 'd-link'].forEach(function (id) { $(id).addEventListener('input', updateDesign); });
  $('designForm').addEventListener('submit', function (e) { e.preventDefault(); });

  /* ---- swatches ---- */
  S.colors.forEach(function (c, i) {
    var b = el('button', { type: 'button', class: 'sw', title: c.name, 'aria-label': c.name, 'aria-pressed': i === 0 ? 'true' : 'false', style: 'background:' + c.hex });
    b.addEventListener('click', function () { st.color = i; Array.prototype.forEach.call($('swatches').children, function (x, k) { x.setAttribute('aria-pressed', k === i ? 'true' : 'false'); }); repaint(); });
    $('swatches').appendChild(b);
  });

  /* ---- tilt ---- */
  if (!reduce) {
    ['heroStage', 'colorCard'].forEach(function (id) {
      var host = $(id), card = id === 'heroStage' ? $('heroCard') : $('colorCard'), area = id === 'heroStage' ? host : host.parentNode;
      area.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = area.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((x - .5) * 24) + 'deg'); card.style.setProperty('--rx', ((.5 - y) * 18) + 'deg');
        card.style.setProperty('--mx', (x * 100) + '%'); card.style.setProperty('--my', (y * 100) + '%');
      });
      area.addEventListener('pointerleave', function () { card.style.removeProperty('--ry'); card.style.removeProperty('--rx'); });
    });
  }

  /* ---- reveal + word lighting ---- */
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12 });
    rv.forEach(function (n) { io.observe(n); });
  } else rv.forEach(function (n) { n.classList.add('in'); });
  var wordsEl = $('words'), spans = [];
  wordsEl.innerHTML = wordsEl.textContent.trim().split(/\s+/).map(function (w) { return '<span>' + esc(w) + '</span>'; }).join(' ');
  spans = Array.prototype.slice.call(wordsEl.children);
  function lightWords() {
    if (reduce) { spans.forEach(function (s) { s.classList.add('lit'); }); return; }
    var r = wordsEl.getBoundingClientRect(), vh = window.innerHeight, p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height + vh * 0.25)));
    spans.forEach(function (s, i) { s.classList.toggle('lit', i / spans.length < p * 1.05); });
  }
  window.addEventListener('scroll', lightWords, { passive: true }); window.addEventListener('resize', lightWords); lightWords();

  /* ---- rating math ---- */
  function mathUpdate() {
    var R = +$('m-r').value, N = +$('m-n').value, C = +$('m-c').value, P = +$('m-p').value, s = +$('m-s').value, out = $('mathOut'); out.textContent = '';
    if (!(R >= 1 && R <= 5 && N >= 0 && C > 0 && P > 0 && s >= 1 && s <= 5)) { out.appendChild(el('p', { class: 'note' }, 'Έλεγξε τα νούμερα.')); return; }
    var k = C * 4.33 * P / 100, a = function (m) { return (R * N + s * k * m) / (N + k * m); };
    [[nf(k, 1), 'νέες κριτικές / μήνα'], [nf(a(3), 2), 'βαθμολογία μετά από 3 μήνες'], [nf(a(12), 2), 'βαθμολογία μετά από 12 μήνες']].forEach(function (x, i) {
      out.appendChild(el('div', null, el('div', { class: 'num' + (i && a(i === 1 ? 3 : 12) > R ? ' good' : '') }, x[0]), el('div', { class: 'lab' }, x[1])));
    });
  }
  Array.prototype.forEach.call($('mathForm').elements, function (f) { f.addEventListener('input', mathUpdate); });
  $('mathForm').addEventListener('submit', function (e) { e.preventDefault(); }); mathUpdate();

  /* ---- buy ---- */
  function tier(q) { var t = S.discounts[0]; S.discounts.forEach(function (d) { if (q >= d.min) t = d; }); return t; }
  function c(x) { return eur.format(x / 100); }
  function compute() {
    var p = S.products.filter(function (x) { return x.id === st.prod; })[0], q = parseInt($('o-qty').value, 10);
    if (!p || !(q >= 1)) return null;
    var unit = Math.round(p.price * 100), sub = unit * q, t = tier(q), disc = Math.round(sub * t.rate), net = sub - disc;
    var ship = net >= S.freeShippingFrom * 100 ? 0 : Math.round(S.shipping * 100), base = net + ship, vat = Math.round(base * S.vatRate);
    return { p: p, q: q, unit: unit, sub: sub, rate: t.rate, disc: disc, ship: ship, vat: vat, total: base + vat };
  }
  function renderSum() {
    var r = compute(), tb = $('sumTable').tBodies[0]; tb.textContent = '';
    var next = null; S.discounts.forEach(function (d) { if (!next && d.min > (parseInt($('o-qty').value, 10) || 0)) next = d; });
    $('tierHint').textContent = r ? (r.rate ? 'Έκπτωση ' + Math.round(r.rate * 100) + '% για ' + r.q + ' τεμ.' : 'Χωρίς έκπτωση ποσότητας.') + (next ? ' Στα ' + next.min + ' τεμ.: −' + Math.round(next.rate * 100) + '%.' : '') : '';
    if (!r) { $('sumFormula').textContent = 'Βάλε ποσότητα 1 ή περισσότερα.'; return null; }
    [[r.p.name + ' × ' + r.q, c(r.sub)], ['Έκπτωση ποσότητας', r.disc ? '−' + c(r.disc) : '—'], ['Μεταφορικά', r.ship ? c(r.ship) : 'Δωρεάν'], ['ΦΠΑ ' + Math.round(S.vatRate * 100) + '%', c(r.vat)], ['Σύνολο', c(r.total)]].forEach(function (x, i, a) {
      tb.appendChild(el('tr', i === a.length - 1 ? { class: 'total' } : null, el('th', { scope: 'row' }, x[0]), el('td', null, x[1])));
    });
    $('sumFormula').textContent = 'Σύνολο = (' + c(r.sub) + ' − ' + c(r.disc) + ' + ' + (r.ship ? c(r.ship) : '0') + ') × ' + (1 + S.vatRate).toFixed(2);
    return r;
  }
  function choice(parent, label, sub, pressed, fn) {
    var b = el('button', { type: 'button', class: 'choice', 'aria-pressed': pressed ? 'true' : 'false' }, el('b', null, label), sub ? el('span', null, sub) : null);
    b.addEventListener('click', fn); parent.appendChild(b); return b;
  }
  function renderChoices() {
    var pc = $('prodChoices'); pc.textContent = '';
    S.products.forEach(function (p) { choice(pc, p.name, eur.format(p.price) + ' / τεμ. · ' + p.desc, p.id === st.prod, function () { st.prod = p.id; renderChoices(); renderSum(); }); });
    var qc = $('qtyChoices'), cur = parseInt($('o-qty').value, 10); qc.textContent = '';
    [10, 25, 50, 100].forEach(function (q) { choice(qc, String(q), null, q === cur, function () { $('o-qty').value = q; renderChoices(); renderSum(); }); });
  }
  $('o-qty').addEventListener('input', function () { renderChoices(); renderSum(); });
  renderChoices(); renderSum();

  $('orderForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var g = function (id) { return $(id).value.trim(); }, msg = $('orderMsg'), res = $('orderResult'), r = renderSum();
    msg.textContent = ''; res.textContent = '';
    if (!r) msg.textContent = 'Έλεγξε την ποσότητα.';
    else if (!g('o-biz') || !g('o-name') || !g('o-email')) msg.textContent = 'Συμπλήρωσε επωνυμία, ονοματεπώνυμο και email.';
    else if (!$('o-email').checkValidity()) msg.textContent = 'Το email δεν φαίνεται σωστό.';
    else if (g('o-tel') && !$('o-tel').checkValidity()) msg.textContent = 'Το τηλέφωνο πρέπει να έχει 8–20 ψηφία.';
    else if (!$('o-consent').checked) msg.textContent = 'Χρειάζεται η συγκατάθεσή σου για να προχωρήσουμε.';
    if (msg.textContent) return;
    var dg = diagnose(st.link);
    var body = ['Παραγγελία ' + S.brand, '', 'Προϊόν: ' + r.p.name, 'Ποσότητα: ' + r.q, 'Σύνολο (με ΦΠΑ): ' + c(r.total), '',
      'Επωνυμία: ' + g('o-biz'), 'Όνομα: ' + g('o-name'), 'Email: ' + g('o-email'), 'Τηλέφωνο: ' + g('o-tel'), 'Σημειώσεις: ' + g('o-notes'), '',
      'Σχεδιασμός', '  Όνομα στην κάρτα: ' + st.name, '  Χρώμα: ' + S.colors[st.color].name + ' (' + S.colors[st.color].hex + ')', '  Link κριτικής: ' + st.link + '  [' + dg.tag + ']'].join('\n');
    var ta = el('textarea', { readonly: '', rows: '12', 'aria-label': 'Κείμενο παραγγελίας' }); ta.value = body;
    var copy = el('button', { type: 'button', class: 'btn ghost' }, 'Αντιγραφή');
    copy.addEventListener('click', function () { ta.select(); (navigator.clipboard ? navigator.clipboard.writeText(body) : Promise.reject()).then(function () { copy.textContent = 'Αντιγράφηκε'; }, function () { document.execCommand('copy'); copy.textContent = 'Αντιγράφηκε'; }); });
    res.appendChild(el('p', null, S.email ? 'Έτοιμο. Πάτα «Άνοιγμα email» και στείλε το μήνυμα.' : 'Έτοιμο. Αντίγραψε το κείμενο και στείλε το στον πωλητή.'));
    res.appendChild(ta);
    var row = el('div', { class: 'row' }, copy);
    if (S.email) row.appendChild(el('a', { class: 'btn', href: 'mailto:' + S.email + '?subject=' + encodeURIComponent('Παραγγελία ' + S.brand) + '&body=' + encodeURIComponent(body) }, 'Άνοιγμα email'));
    res.appendChild(row);
  });

  updateDesign();
})();
