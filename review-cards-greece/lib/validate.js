/* Greek-specific validators, shared by the browser and the API. */
(function (root, factory) {
  var m = factory();
  if (typeof module === 'object' && module.exports) module.exports = m; else root.Validate = m;
})(typeof window !== 'undefined' ? window : this, function () {
  function afm(v) {
    v = String(v || '').replace(/\s+/g, '');
    if (!/^\d{9}$/.test(v) || /^0+$/.test(v)) return false;
    var sum = 0; for (var i = 0; i < 8; i++) sum += parseInt(v[i], 10) * Math.pow(2, 8 - i);
    return (sum % 11) % 10 === parseInt(v[8], 10);
  }
  function phone(v) { v = String(v || '').replace(/[\s\-().]/g, '').replace(/^(\+30|0030)/, ''); return /^(69\d{8}|2\d{9})$/.test(v); }
  function tk(v) { return /^[1-8]\d{4}$/.test(String(v || '').replace(/\s+/g, '')); }
  function email(v) { v = String(v || '').trim(); return v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function httpsUrl(v) { try { var u = new URL(String(v || '').trim()); return u.protocol === 'https:' && u.hostname.indexOf('.') > 0 && String(v).length <= 400; } catch (e) { return false; } }
  function name(v) { v = String(v || '').trim(); return v.length >= 2 && v.length <= 120; }
  return { afm: afm, phone: phone, tk: tk, email: email, httpsUrl: httpsUrl, name: name };
});
