/* Product renderers (card / stand / sticker), contrast helper and Google review-link checker. */
(function () {
  'use strict';
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lum(hex) { var c = [1, 3, 5].map(function (i) { var v = parseInt(hex.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function textOn(bg) { var l = lum(bg); return (1.05 / (l + 0.05)) >= ((l + 0.05) / 0.0585) ? '#ffffff' : '#111111'; }
  function qrSvg(q) {
    var d = [], n = q.size + 2;
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.modules[y][x]) d.push('M' + (x + 1) + ',' + (y + 1) + 'h1v1h-1z');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges" role="img" aria-label="QR κωδικός"><path d="' + d.join('') + '" fill="#111"/></svg>';
  }
  function colorOf(id) { var cs = window.STORE.colors, c = cs.filter(function (x) { return x.id === id; })[0]; return c || cs[0]; }
  function paint(node, sku, st) {
    var hex = colorOf(st.color).hex, fg = textOn(hex), star = fg === '#ffffff' ? '#ffc233' : '#c2410c';
    node.className = 'prod3d p-' + sku; node.style.setProperty('--bg', hex); node.style.setProperty('--fg', fg); node.style.setProperty('--star', star);
    var name = esc(st.name || window.STORE.brand), qr = '<div class="c-qr">' + (st.qr ? qrSvg(st.qr) : '') + '</div>';
    var stars = '<div class="c-stars" aria-hidden="true">★★★★★</div>', cta = '<div class="c-cta">Άγγιξε ή σκάναρε</div>';
    if (sku === 'stand') node.innerHTML = '<div class="panel">' + stars + '<div class="c-name">' + name + '</div>' + qr + cta + '</div><div class="base"></div><div class="sheen"></div>';
    else if (sku === 'sticker') node.innerHTML = '<div class="c-in">' + stars + qr + '<div class="c-name">' + name + '</div>' + cta + '</div><div class="sheen"></div>';
    else node.innerHTML = '<div class="c-in">' + stars + '<div class="c-name">' + name + '</div>' + cta + '</div>' + qr + '<div class="sheen"></div>';
  }
  function diagnose(raw) {
    var u; try { u = new URL(raw); } catch (e) { return { cls: 'bad', tag: 'Άκυρο', text: 'Δεν είναι έγκυρο link. Πρέπει να ξεκινά με https://', ok: false }; }
    if (u.protocol !== 'https:') return { cls: 'bad', tag: 'Άκυρο', text: 'Χρησιμοποίησε https:// (ασφαλές link).', ok: false };
    var h = u.hostname.replace(/^www\./, ''), p = u.pathname;
    if (h.indexOf('.') < 1) return { cls: 'bad', tag: 'Άκυρο', text: 'Μη έγκυρη διεύθυνση.', ok: false };
    if (/EXAMPLE|YOUR_/i.test(raw)) return { cls: 'warn', tag: 'Παράδειγμα', text: 'Δείγμα. Βάλε το δικό σου link ή Place ID πριν παραγγείλεις.', ok: true, sample: true };
    if (h === 'g.page' && /\/r\/.+\/review\/?$/.test(p)) return { cls: 'ok', tag: 'Σωστό', text: 'Ανοίγει κατευθείαν τη φόρμα κριτικής.', ok: true };
    if (h === 'search.google.com' && /\/local\/writereview/.test(p) && u.searchParams.get('placeid')) return { cls: 'ok', tag: 'Σωστό', text: 'Link με Place ID: ανοίγει κατευθείαν τη φόρμα κριτικής.', ok: true };
    if (h === 'g.page') return { cls: 'warn', tag: 'Προσοχή', text: 'Ανοίγει το προφίλ, όχι τη φόρμα. Ψάξε το link «Ζήτα κριτικές» (τελειώνει σε /review).', ok: true };
    if (h === 'maps.app.goo.gl' || h === 'goo.gl' || (/^google\.[a-z.]+$/.test(h) && /\/maps/.test(p))) return { cls: 'warn', tag: 'Προσοχή', text: 'Link χάρτη: ανοίγει το κατάστημα, όχι τη φόρμα κριτικής.', ok: true };
    if (h === 'g.co') return { cls: 'warn', tag: 'Προσοχή', text: 'Το g.co/kgs ανοίγει αποτέλεσμα αναζήτησης, όχι τη φόρμα κριτικής.', ok: true };
    return { cls: 'warn', tag: 'Άγνωστο', text: 'Δεν αναγνωρίζεται ως link κριτικής Google. Δοκίμασέ το στο κινητό σου πριν παραγγείλεις.', ok: true };
  }
  function encode(link) { try { return window.QR.encode(link, 'M'); } catch (e) { return null; } }
  window.Designer = { paint: paint, diagnose: diagnose, textOn: textOn, encode: encode, colorOf: colorOf, esc: esc };
})();
