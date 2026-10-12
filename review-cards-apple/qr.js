/* Minimal QR Code generator (byte mode, versions 1-10, ECC L/M/Q/H). No dependencies.
   Follows ISO/IEC 18004; structure inspired by the public-domain-style reference approach. */
(function () {
  'use strict';
  var ECC_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28]
  ];
  var NUM_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8]
  ];
  var ECL_INDEX = { L: 0, M: 1, Q: 2, H: 3 };
  var ECL_FORMAT = { L: 1, M: 0, Q: 3, H: 2 };
  var MAX_VERSION = 10;

  function utf8(str) { return Array.prototype.slice.call(new TextEncoder().encode(str)); }
  function rawModules(v) {
    var r = (16 * v + 128) * v + 64;
    if (v >= 2) { var n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
    return r;
  }
  function dataCodewords(v, e) { return Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[e][v] * NUM_BLOCKS[e][v]; }
  function gfMul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; }
    return z;
  }
  function rsDivisor(d) {
    var r = [], i, j, root = 1;
    for (i = 0; i < d; i++) r.push(0);
    r[d - 1] = 1;
    for (i = 0; i < d; i++) {
      for (j = 0; j < d; j++) { r[j] = gfMul(r[j], root); if (j + 1 < d) r[j] ^= r[j + 1]; }
      root = gfMul(root, 2);
    }
    return r;
  }
  function rsRemainder(data, div) {
    var r = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ r.shift(); r.push(0);
      div.forEach(function (c, i) { r[i] ^= gfMul(c, f); });
    });
    return r;
  }

  function encode(text, eclName) {
    var e = ECL_INDEX[eclName || 'M'];
    var bytes = utf8(text), v, cap;
    for (v = 1; v <= MAX_VERSION; v++) {
      cap = dataCodewords(v, e) * 8;
      var need = 4 + (v <= 9 ? 8 : 16) + bytes.length * 8;
      if (need <= cap) break;
    }
    if (v > MAX_VERSION) throw new Error('Το κείμενο είναι πολύ μεγάλο για QR (έως περίπου ' + (dataCodewords(MAX_VERSION, e) - 3) + ' byte).');

    var bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4); put(bytes.length, v <= 9 ? 8 : 16);
    bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, cap - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) { var b = 0; for (var k = 0; k < 8; k++) b = (b << 1) | bits[i + k]; data.push(b); }
    for (var pad = 0xEC; data.length < cap / 8; pad ^= 0xEC ^ 0x11) data.push(pad);

    // error correction + interleave
    var nb = NUM_BLOCKS[e][v], ecl = ECC_PER_BLOCK[e][v], raw = Math.floor(rawModules(v) / 8);
    var shortN = nb - raw % nb, shortLen = Math.floor(raw / nb), blocks = [], div = rsDivisor(ecl), off = 0;
    for (i = 0; i < nb; i++) {
      var dl = shortLen - ecl + (i < shortN ? 0 : 1), dat = data.slice(off, off + dl); off += dl;
      var ecc = rsRemainder(dat, div);
      if (i < shortN) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var all = [];
    for (i = 0; i < blocks[0].length; i++) blocks.forEach(function (blk, j) { if (i !== shortLen - ecl || j >= shortN) all.push(blk[i]); });

    // matrix
    var size = v * 4 + 17, m = [], fn = [];
    for (i = 0; i < size; i++) { m.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function set(x, y, d) { m[y][x] = d; fn[y][x] = true; }
    for (i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var pos = [];
    if (v > 1) {
      var na = Math.floor(v / 7) + 2, step = Math.ceil((v * 4 + 4) / (na * 2 - 2)) * 2;
      pos = [6];
      for (var p = size - 7; pos.length < na; p -= step) pos.splice(1, 0, p);
    }
    pos.forEach(function (ax, ai) {
      pos.forEach(function (ay, aj) {
        if ((ai === 0 && aj === 0) || (ai === 0 && aj === pos.length - 1) || (ai === pos.length - 1 && aj === 0)) return;
        for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      });
    });
    function format(mask) {
      var d = (ECL_FORMAT[eclName || 'M'] << 3) | mask, r = d;
      for (var q = 0; q < 10; q++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      var f = ((d << 10) | r) ^ 0x5412;
      function bit(n) { return ((f >>> n) & 1) !== 0; }
      for (var q2 = 0; q2 <= 5; q2++) set(8, q2, bit(q2));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (q2 = 9; q2 < 15; q2++) set(14 - q2, 8, bit(q2));
      for (q2 = 0; q2 < 8; q2++) set(size - 1 - q2, 8, bit(q2));
      for (q2 = 8; q2 < 15; q2++) set(8, size - 15 + q2, bit(q2));
      set(8, size - 8, true);
    }
    format(0);
    if (v >= 7) {
      var vr = v;
      for (i = 0; i < 12; i++) vr = (vr << 1) ^ ((vr >>> 11) * 0x1F25);
      var vb = (v << 12) | vr;
      for (i = 0; i < 18; i++) { var bt = ((vb >>> i) & 1) !== 0, a = size - 11 + i % 3, c = Math.floor(i / 3); set(a, c, bt); set(c, a, bt); }
    }
    // codewords
    var idx = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (var j = 0; j < 2; j++) {
        var x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!fn[y][x] && idx < all.length * 8) { m[y][x] = ((all[idx >>> 3] >>> (7 - (idx & 7))) & 1) !== 0; idx++; }
      }
    }
    function mask(k) {
      for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
        var inv;
        switch (k) {
          case 0: inv = (x + y) % 2 === 0; break;
          case 1: inv = y % 2 === 0; break;
          case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break;
          case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = x * y % 2 + x * y % 3 === 0; break;
          case 6: inv = (x * y % 2 + x * y % 3) % 2 === 0; break;
          default: inv = ((x + y) % 2 + x * y % 3) % 2 === 0;
        }
        if (!fn[y][x] && inv) m[y][x] = !m[y][x];
      }
    }
    function penalty() {
      var s = 0, y, x, run, dark = 0;
      for (y = 0; y < size; y++) for (var dir = 0; dir < 2; dir++) {
        run = 1;
        for (x = 1; x < size; x++) {
          var a = dir ? m[x][y] : m[y][x], b = dir ? m[x - 1][y] : m[y][x - 1];
          if (a === b) { run++; if (run === 5) s += 3; else if (run > 5) s++; } else run = 1;
        }
      }
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) s += 3;
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (m[y][x]) dark++;
      return s + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    }
    var best = 0, bestP = Infinity;
    for (var k2 = 0; k2 < 8; k2++) {
      mask(k2); format(k2);
      var pen = penalty();
      if (pen < bestP) { bestP = pen; best = k2; }
      mask(k2);
    }
    mask(best); format(best);
    return { version: v, size: size, modules: m, bytes: bytes.length, ecl: eclName || 'M' };
  }

  function toSvg(text, opts) {
    opts = opts || {};
    var q = encode(text, opts.ecl), border = opts.border == null ? 4 : opts.border, d = [];
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.modules[y][x]) d.push('M' + (x + border) + ',' + (y + border) + 'h1v1h-1z');
    var n = q.size + border * 2;
    return {
      info: q,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges" role="img" aria-label="QR κωδικός">' +
        '<rect width="100%" height="100%" fill="' + (opts.light || '#fff') + '"/><path d="' + d.join('') + '" fill="' + (opts.dark || '#000') + '"/></svg>'
    };
  }
  window.QR = { encode: encode, toSvg: toSvg };
})();
