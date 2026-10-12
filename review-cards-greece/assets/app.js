/* Common store code: cart, VAT display mode, header, ribbon, reveal. */
(function () {
  'use strict';
  var S = window.STORE, P = window.Pricing;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nfEur = new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' });
  function el(tag, attrs) {
    var e = document.createElement(tag);
    for (var k in (attrs || {})) if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null || c === false) continue; e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c); }
    return e;
  }
  function eur(cents) { return nfEur.format(cents / 100); }

  /* ---- safe storage ---- */
  var mem = {};
  function sget(k, session) { try { var v = (session ? sessionStorage : localStorage).getItem(k); return v == null ? mem[k] : JSON.parse(v); } catch (e) { return mem[k]; } }
  function sset(k, v, session) { mem[k] = v; try { (session ? sessionStorage : localStorage).setItem(k, JSON.stringify(v)); } catch (e) { /* blocked: memory only */ } }

  /* ---- cart ---- */
  var Cart = {
    items: function () { var a = sget('aster.cart'); return Array.isArray(a) ? a : []; },
    save: function (a) { sset('aster.cart', a); document.dispatchEvent(new CustomEvent('cart:changed')); },
    add: function (line) {
      var a = this.items(), same = a.filter(function (x) { return x.sku === line.sku && x.design.name === line.design.name && x.design.link === line.design.link && x.design.color === line.design.color; })[0];
      if (same) same.qty = Math.min(5000, same.qty + line.qty); else a.push({ id: Math.random().toString(36).slice(2, 9), sku: line.sku, qty: line.qty, design: line.design });
      this.save(a);
    },
    setQty: function (id, q) { var a = this.items(); a.forEach(function (x) { if (x.id === id) x.qty = Math.max(1, Math.min(5000, q | 0)); }); this.save(a); },
    remove: function (id) { this.save(this.items().filter(function (x) { return x.id !== id; })); },
    clear: function () { this.save([]); },
    count: function () { return this.items().reduce(function (n, x) { return n + x.qty; }, 0); },
    skuQty: function (sku) { return this.items().reduce(function (n, x) { return n + (x.sku === sku ? x.qty : 0); }, 0); },
    lines: function () { return this.items().map(function (x) { return { sku: x.sku, qty: x.qty }; }); }
  };

  /* ---- price display mode (B2B default: excl. VAT) ---- */
  var Vat = {
    mode: function () { return sget('aster.vat') === 'inc' ? 'inc' : 'ex'; },
    set: function (m) { sset('aster.vat', m); Vat.apply(); document.dispatchEvent(new CustomEvent('vat:changed')); },
    cents: function (net) { return Vat.mode() === 'inc' ? Math.round(net * (1 + S.vatRate)) : net; },
    label: function () { return Vat.mode() === 'inc' ? 'με ΦΠΑ' : '+ ΦΠΑ'; },
    apply: function () {
      Array.prototype.forEach.call(document.querySelectorAll('[data-net]'), function (n) { n.textContent = eur(Vat.cents(Math.round(parseFloat(n.getAttribute('data-net')) * 100))); });
      Array.prototype.forEach.call(document.querySelectorAll('[data-vat-label]'), function (n) { n.textContent = Vat.label(); });
      Array.prototype.forEach.call(document.querySelectorAll('.vat-toggle button'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mode') === Vat.mode() ? 'true' : 'false'); });
    }
  };

  function toast(html, href, label) {
    var old = document.querySelector('.toast'); if (old) old.remove();
    var t = el('div', { class: 'toast', role: 'status' }, el('span', null, html));
    if (href) t.appendChild(el('a', { href: href }, label)); document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, 6000);
  }

  function hydrateHeader() {
    var n = Cart.count(); Array.prototype.forEach.call(document.querySelectorAll('.cart-count'), function (c) { c.textContent = n || ''; c.setAttribute('data-n', n); c.setAttribute('aria-label', n + ' τεμάχια στο καλάθι'); });
  }
  document.addEventListener('cart:changed', hydrateHeader);
  Array.prototype.forEach.call(document.querySelectorAll('.vat-toggle button'), function (b) { b.addEventListener('click', function () { Vat.set(b.getAttribute('data-mode')); }); });
  if (S.demo) {
    var r = el('div', { class: 'ribbon', role: 'note' }, 'Δοκιμαστική λειτουργία: οι παραγγελίες δεν καταχωρούνται ακόμη. ', el('a', { href: '/epikoinonia' }, 'Επικοινωνία'));
    document.body.insertBefore(r, document.body.firstChild);
  }
  hydrateHeader(); Vat.apply();

  /* ---- reveal ---- */
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .1 });
    Array.prototype.forEach.call(rv, function (n) { io.observe(n); });
  } else Array.prototype.forEach.call(rv, function (n) { n.classList.add('in'); });

  /* ---- tilt helper ---- */
  function tilt(area, card) {
    if (reduce) return;
    area.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = area.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', ((x - .5) * 22) + 'deg'); card.style.setProperty('--rx', ((.5 - y) * 16) + 'deg'); card.style.setProperty('--mx', (x * 100) + '%'); card.style.setProperty('--my', (y * 100) + '%');
    });
    area.addEventListener('pointerleave', function () { card.style.removeProperty('--ry'); card.style.removeProperty('--rx'); });
  }

  window.App = { S: S, P: P, V: window.Validate, el: el, eur: eur, Cart: Cart, Vat: Vat, toast: toast, sget: sget, sset: sset, tilt: tilt, reduce: reduce, hydrateHeader: hydrateHeader };
})();
