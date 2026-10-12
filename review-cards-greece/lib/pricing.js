/* Shared by the browser and the serverless API. All money is handled in integer cents. */
(function (root, factory) {
  var m = factory();
  if (typeof module === 'object' && module.exports) module.exports = m; else root.Pricing = m;
})(typeof window !== 'undefined' ? window : this, function () {
  function tierRate(cfg, qty) { var r = 0; cfg.discounts.forEach(function (d) { if (qty >= d.min) r = d.rate; }); return r; }
  function product(cfg, sku) { return cfg.products.filter(function (p) { return p.sku === sku; })[0]; }

  /* lines: [{sku, qty}]; opts: {courier, island, payment}. Quantity tiers are applied to the TOTAL quantity of each SKU. */
  function price(cfg, lines, opts) {
    opts = opts || {};
    var skuQty = {}, out = { lines: [], subtotal: 0, discount: 0, net: 0, shipping: 0, codFee: 0, vat: 0, total: 0, freeShipping: false, errors: [] };
    lines.forEach(function (l) { skuQty[l.sku] = (skuQty[l.sku] || 0) + l.qty; });
    lines.forEach(function (l) {
      var p = product(cfg, l.sku);
      if (!p || !(l.qty >= 1) || l.qty !== Math.floor(l.qty) || l.qty > 5000) { out.errors.push('Μη έγκυρη γραμμή: ' + l.sku); return; }
      var unit = Math.round(p.price * 100), rate = tierRate(cfg, skuQty[l.sku]), unitNet = Math.round(unit * (1 - rate));
      var sub = unit * l.qty, lineNet = unitNet * l.qty;
      out.lines.push({ sku: l.sku, qty: l.qty, unit: unit, unitNet: unitNet, rate: rate, sub: sub, lineNet: lineNet, discount: sub - lineNet });
      out.subtotal += sub; out.discount += sub - lineNet; out.net += lineNet;
    });
    if (out.lines.length) {
      var s = cfg.shipping, c = s.couriers.filter(function (x) { return x.id === opts.courier; })[0];
      if (c) {
        var free = out.net >= Math.round((opts.island ? s.freeFromIslands : s.freeFrom) * 100);
        out.freeShipping = free; out.shipping = free ? 0 : Math.round((opts.island ? c.islands : c.mainland) * 100);
      } else if (opts.courier) out.errors.push('Άγνωστη εταιρεία μεταφοράς');
      if (opts.payment === 'cod' && cfg.payments.cod.enabled) out.codFee = Math.round(cfg.payments.cod.fee * 100);
    }
    var taxable = out.net + out.shipping + out.codFee;
    out.taxable = taxable; out.vat = Math.round(taxable * cfg.vatRate); out.total = taxable + out.vat;
    return out;
  }
  return { price: price, tierRate: tierRate, product: product };
});
