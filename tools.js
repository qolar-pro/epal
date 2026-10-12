/* Interactive tools — pure JS, no dependencies. Each tool: {id,title,desc,hue,render(box)} */
(function () {
  'use strict';
  var TOOLS = window.TOOLS = [];

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { add(el, x); });
    else el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function field(label, input, id) {
    input.id = id;
    return h('div', { class: 'field' }, h('label', { for: id }, label), input);
  }
  function num(id, val, min, max, step) {
    var i = h('input', { type: 'number', value: val, min: min, max: max, step: step || 1 });
    i.id = id; return i;
  }
  function pad(s, n) { s = String(s); while (s.length < n) s = '0' + s; return s; }
  function group4(s) { return s.replace(/(.{4})(?=.)/g, '$1 '); }
  function fmtBytes(b) {
    return b.toLocaleString('el-GR', { maximumFractionDigits: 0 }) + ' byte  =  ' +
      (b / 1024).toLocaleString('el-GR', { maximumFractionDigits: 2 }) + ' KB  =  ' +
      (b / 1048576).toLocaleString('el-GR', { maximumFractionDigits: 3 }) + ' MB';
  }

  /* ---------- 1. Base converter ---------- */
  TOOLS.push({
    id: 'bases', hue: 195, title: 'Μετατροπέας βάσεων',
    desc: 'Δεκαδικό, δυαδικό, οκταδικό και δεκαεξαδικό. Άλλαξε ένα πεδίο και ενημερώνονται τα άλλα, με τα βήματα της μετατροπής.',
    render: function (box) {
      var defs = [['dec', 'Δεκαδικό', 10, /^[0-9]+$/], ['bin', 'Δυαδικό', 2, /^[01]+$/], ['oct', 'Οκταδικό', 8, /^[0-7]+$/], ['hex', 'Δεκαεξαδικό', 16, /^[0-9a-f]+$/i]];
      var inputs = {}, fields = h('div', { class: 'fields' }), steps = h('div'), msg = h('p', { class: 'err', role: 'alert' });
      defs.forEach(function (d) {
        var i = h('input', { type: 'text', class: 'mono', autocomplete: 'off', spellcheck: 'false', inputmode: d[2] === 16 ? 'text' : 'numeric' });
        i.addEventListener('input', function () { fromField(d); });
        inputs[d[0]] = i; fields.appendChild(field(d[1] + ' (βάση ' + d[2] + ')', i, 'b-' + d[0]));
      });
      box.appendChild(fields); box.appendChild(msg); box.appendChild(steps);

      function fromField(d) {
        var v = inputs[d[0]].value.trim().replace(/\s+/g, '');
        msg.textContent = '';
        if (v === '') { defs.forEach(function (x) { if (x !== d) inputs[x[0]].value = ''; }); clear(steps); return; }
        if (!d[3].test(v)) { msg.textContent = 'Μη έγκυρος χαρακτήρας για βάση ' + d[2] + '.'; return; }
        var n = 0n, b = BigInt(d[2]);
        for (var k = 0; k < v.length; k++) n = n * b + BigInt(parseInt(v[k], 16));
        defs.forEach(function (x) { if (x !== d) inputs[x[0]].value = x[2] === 16 ? n.toString(16).toUpperCase() : n.toString(x[2]); });
        showSteps(n);
      }
      function showSteps(n) {
        clear(steps);
        if (n > 9007199254740991n) { steps.appendChild(h('p', { class: 'muted' }, 'Τα βήματα εμφανίζονται για αριθμούς έως 2^53.')); return; }
        var N = Number(n), rows = [];
        steps.appendChild(h('h2', null, 'Δεκαδικό → δυαδικό (διαδοχικές διαιρέσεις με το 2)'));
        if (N === 0) { steps.appendChild(h('p', null, '0 → 0')); }
        else {
          var q = N, tb = h('table', { class: 'data' }, h('thead', null, h('tr', null, ['Διαίρεση', 'Πηλίκο', 'Υπόλοιπο'].map(function (t) { return h('th', null, t); }))));
          var body = h('tbody');
          while (q > 0) {
            var r = q % 2, nq = Math.floor(q / 2);
            body.appendChild(h('tr', null, h('td', { class: 'mono' }, q + ' : 2'), h('td', { class: 'mono' }, nq), h('td', { class: 'mono' }, r)));
            rows.push(r); q = nq;
          }
          tb.appendChild(body); steps.appendChild(tb);
          steps.appendChild(h('p', { class: 'formula' }, 'Διάβασε τα υπόλοιπα από κάτω προς τα πάνω: ' + rows.slice().reverse().join('')));
        }
        var bin = N.toString(2);
        steps.appendChild(h('h2', null, 'Δυαδικό → δεκαδικό (θέσεις)'));
        var terms = [], total = 0;
        for (var i = 0; i < bin.length; i++) {
          if (bin[i] === '1') { var p = bin.length - 1 - i; terms.push('2^' + p + ' (' + Math.pow(2, p) + ')'); total += Math.pow(2, p); }
        }
        steps.appendChild(h('p', { class: 'formula' }, bin + ' = ' + (terms.length ? terms.join(' + ') : '0') + ' = ' + total));
        steps.appendChild(h('p', { class: 'muted' }, 'Ομαδοποίηση: δυαδικό ' + group4(pad(bin, Math.ceil(bin.length / 4) * 4)) +
          ' → κάθε 4 bit δίνουν 1 δεκαεξαδικό ψηφίο: ' + N.toString(16).toUpperCase() + '.'));
      }
      inputs.dec.value = '45'; fromField(defs[0]);
    }
  });

  /* ---------- 2. Two's complement ---------- */
  TOOLS.push({
    id: 'twos', hue: 215, title: 'Συμπλήρωμα ως προς 2',
    desc: 'Δες πώς αναπαρίσταται ένας ακέραιος με πρόσημο-μέτρο, συμπλήρωμα ως προς 1 και συμπλήρωμα ως προς 2.',
    render: function (box) {
      var bitsSel = h('select', null, [4, 8, 16].map(function (n) { return h('option', { value: n }, n + ' bit'); }));
      bitsSel.value = '8';
      var inp = num('tc-n', -25, null, null, 1);
      var out = h('div');
      box.appendChild(h('div', { class: 'fields' }, field('Bit', bitsSel, 'tc-b'), field('Δεκαδικός αριθμός', inp, 'tc-n2')));
      box.appendChild(out);
      function bin(v, n) { return pad(v.toString(2), n); }
      function flip(s) { return s.split('').map(function (c) { return c === '1' ? '0' : '1'; }).join(''); }
      function upd() {
        clear(out);
        var n = parseInt(bitsSel.value, 10), raw = inp.value.trim();
        if (raw === '' || !/^-?\d+$/.test(raw)) { out.appendChild(h('p', { class: 'err' }, 'Γράψε έναν ακέραιο.')); return; }
        var x = parseInt(raw, 10), lo = -Math.pow(2, n - 1), hi = Math.pow(2, n - 1) - 1;
        out.appendChild(h('p', { class: 'formula' }, 'Εύρος ' + n + ' bit σε συμπλήρωμα ως προς 2: ' + lo + ' έως ' + hi + '   (−2^' + (n - 1) + ' έως 2^' + (n - 1) + ' − 1)'));
        if (x < lo || x > hi) {
          out.appendChild(h('div', { class: 'warn' }, 'Υπερχείλιση (overflow): ο ' + x + ' δεν χωράει σε ' + n + ' bit. Θα χρειαζόταν τουλάχιστον ' + bitsNeeded(x) + ' bit.'));
          return;
        }
        var mag = Math.abs(x), magBits = bin(mag, n - 1), lines = [];
        var sm = (x < 0 ? '1' : '0') + magBits;
        var oc = x < 0 ? flip(bin(mag, n)) : bin(x, n);
        var tc = x < 0 ? bin(Math.pow(2, n) + x, n) : bin(x, n);
        lines.push('Πρόσημο-μέτρο:   ' + group4(sm) + '   (bit προσήμου ' + sm[0] + ' + μέτρο ' + magBits + ')');
        if (x < 0) {
          lines.push('Συμπλ. ως προς 1: ' + group4(oc) + '   (αντιστροφή όλων των bit του ' + bin(mag, n) + ')');
          lines.push('Συμπλ. ως προς 2: ' + group4(tc) + '   (συμπλ. ως προς 1 + 1 = ' + group4(oc) + ' + 1)');
        } else {
          lines.push('Συμπλ. ως προς 1: ' + group4(oc) + '   (θετικός: ίδια bit)');
          lines.push('Συμπλ. ως προς 2: ' + group4(tc) + '   (θετικός: ίδια bit)');
        }
        out.appendChild(h('pre', { class: 'out' }, lines.join('\n')));
        // check by weights
        var w = [], tot = 0;
        for (var i = 0; i < n; i++) {
          if (tc[i] === '1') { var p = n - 1 - i, val = (i === 0 ? -1 : 1) * Math.pow(2, p); w.push((i === 0 ? '−' : '+') + '2^' + p); tot += val; }
        }
        out.appendChild(h('p', { class: 'formula' }, 'Έλεγχος με βάρη: ' + (w.join(' ').replace(/^\+/, '') || '0') + ' = ' + tot));
        if (x === lo) out.appendChild(h('p', { class: 'muted' }, 'Ο ' + lo + ' δεν παριστάνεται με πρόσημο-μέτρο ή συμπλήρωμα ως προς 1 στα ' + n + ' bit (αυτές οι μέθοδοι φτάνουν ως ' + (-hi) + ').'));
      }
      function bitsNeeded(x) { var n = 1; while (x < -Math.pow(2, n - 1) || x > Math.pow(2, n - 1) - 1) n++; return n; }
      bitsSel.addEventListener('change', upd); inp.addEventListener('input', upd); upd();
    }
  });

  /* ---------- 3. Image & sound size ---------- */
  TOOLS.push({
    id: 'media', hue: 330, title: 'Μέγεθος εικόνας και ήχου',
    desc: 'Υπολογισμός του μεγέθους μιας ασυμπίεστης εικόνας και ενός ασυμπίεστου ήχου, με τον τύπο και τους αριθμούς.',
    render: function (box) {
      var w = num('im-w', 1920, 1), hh = num('im-h', 1080, 1), d = num('im-d', 24, 1), out1 = h('div');
      box.appendChild(h('h2', null, 'Εικόνα'));
      box.appendChild(h('div', { class: 'fields' }, field('Πλάτος (pixel)', w, 'im-w2'), field('Ύψος (pixel)', hh, 'im-h2'), field('Βάθος χρώματος (bit/pixel)', d, 'im-d2')));
      box.appendChild(out1);
      function u1() {
        clear(out1);
        var W = +w.value, H = +hh.value, D = +d.value;
        if (!(W > 0 && H > 0 && D > 0)) { out1.appendChild(h('p', { class: 'err' }, 'Βάλε θετικούς αριθμούς.')); return; }
        var bits = W * H * D, bytes = bits / 8;
        out1.appendChild(h('div', { class: 'formula' }, 'Μέγεθος (bit) = πλάτος × ύψος × βάθος = ' + W + ' × ' + H + ' × ' + D + ' = ' + bits.toLocaleString('el-GR')));
        out1.appendChild(h('div', { class: 'formula' }, 'Μέγεθος (byte) = ' + bits.toLocaleString('el-GR') + ' / 8 = ' + bytes.toLocaleString('el-GR')));
        out1.appendChild(h('pre', { class: 'out' }, fmtBytes(bytes) + '\nΧρώματα: 2^' + D + ' = ' + Math.pow(2, D).toLocaleString('el-GR')));
      }
      [w, hh, d].forEach(function (i) { i.addEventListener('input', u1); }); u1();

      var ch = num('au-c', 2, 1), sr = num('au-s', 44100, 1), bt = num('au-b', 16, 1), sec = num('au-t', 180, 0), out2 = h('div');
      box.appendChild(h('h2', null, 'Ήχος'));
      box.appendChild(h('div', { class: 'fields' }, field('Κανάλια', ch, 'au-c2'), field('Συχνότητα δειγματοληψίας (Hz)', sr, 'au-s2'), field('Bit ανά δείγμα', bt, 'au-b2'), field('Διάρκεια (sec)', sec, 'au-t2')));
      box.appendChild(out2);
      function u2() {
        clear(out2);
        var C = +ch.value, S = +sr.value, B = +bt.value, T = +sec.value;
        if (!(C > 0 && S > 0 && B > 0 && T >= 0)) { out2.appendChild(h('p', { class: 'err' }, 'Βάλε θετικούς αριθμούς.')); return; }
        var bits = C * S * B * T, bytes = bits / 8;
        out2.appendChild(h('div', { class: 'formula' }, 'Μέγεθος (bit) = κανάλια × συχνότητα × bit × χρόνος = ' + C + ' × ' + S + ' × ' + B + ' × ' + T + ' = ' + bits.toLocaleString('el-GR')));
        out2.appendChild(h('div', { class: 'formula' }, 'Μέγεθος (byte) = ' + bits.toLocaleString('el-GR') + ' / 8 = ' + bytes.toLocaleString('el-GR')));
        out2.appendChild(h('pre', { class: 'out' }, fmtBytes(bytes) + '\nΡυθμός: ' + (C * S * B).toLocaleString('el-GR') + ' bit/s'));
      }
      [ch, sr, bt, sec].forEach(function (i) { i.addEventListener('input', u2); }); u2();
      box.appendChild(h('p', { class: 'muted' }, 'Σύμβαση εδώ: 1 KB = 1024 byte, 1 MB = 1024 KB. Στο βιβλίο ή στις ασκήσεις μπορεί να ζητείται 1000· ακολούθησε αυτό που λέει η άσκηση.'));
    }
  });

  /* ---------- 4. Unicode / UTF-8 ---------- */
  TOOLS.push({
    id: 'utf8', hue: 265, title: 'Χαρακτήρες και UTF-8',
    desc: 'Γράψε κείμενο και δες για κάθε χαρακτήρα τον κωδικό Unicode, τον δεκαδικό κωδικό και τα byte σε UTF-8.',
    render: function (box) {
      var t = h('input', { type: 'text', value: 'Aα€😀', class: 'mono', style: 'width:min(420px,100%)', autocomplete: 'off' });
      var out = h('div');
      box.appendChild(h('div', { class: 'fields' }, field('Κείμενο', t, 'u-t')));
      box.appendChild(out);
      function upd() {
        clear(out);
        var chars = Array.from(t.value);
        if (!chars.length) { out.appendChild(h('p', { class: 'muted' }, 'Γράψε κάτι.')); return; }
        var enc = new TextEncoder(), total = 0;
        var tb = h('table', { class: 'data' }, h('thead', null, h('tr', null, ['Χαρακτήρας', 'Unicode', 'Δεκαδικός', 'Byte UTF-8 (hex)', 'Πλήθος byte'].map(function (x) { return h('th', null, x); }))));
        var body = h('tbody');
        chars.forEach(function (c) {
          var cp = c.codePointAt(0), bytes = Array.from(enc.encode(c));
          total += bytes.length;
          body.appendChild(h('tr', null,
            h('td', { class: 'mono' }, c === ' ' ? '␣' : c),
            h('td', { class: 'mono' }, 'U+' + pad(cp.toString(16).toUpperCase(), 4)),
            h('td', { class: 'num' }, cp),
            h('td', { class: 'mono' }, bytes.map(function (b) { return pad(b.toString(16).toUpperCase(), 2); }).join(' ')),
            h('td', { class: 'num' }, bytes.length)));
        });
        tb.appendChild(body); out.appendChild(tb);
        out.appendChild(h('p', { class: 'formula' }, chars.length + ' χαρακτήρες → ' + total + ' byte σε UTF-8'));
        out.appendChild(h('p', { class: 'muted' }, 'Κανόνας UTF-8: κωδικοί ως U+007F → 1 byte (όπως ASCII)· ως U+07FF → 2 byte· ως U+FFFF → 3 byte· μεγαλύτεροι → 4 byte.'));
      }
      t.addEventListener('input', upd); upd();
    }
  });

  /* ---------- 5. range() explorer ---------- */
  TOOLS.push({
    id: 'range', hue: 145, title: 'range() explorer',
    desc: 'Δες ποια ακολουθία παράγει η range(start, stop, step) και πώς εξελίσσεται ένα for που αθροίζει τους όρους της.',
    render: function (box) {
      var a = num('r-a', 0), b = num('r-b', 10), s = num('r-s', 2), out = h('div');
      box.appendChild(h('div', { class: 'fields' }, field('start', a, 'r-a2'), field('stop (δεν περιλαμβάνεται)', b, 'r-b2'), field('step', s, 'r-s2')));
      box.appendChild(out);
      function upd() {
        clear(out);
        var A = parseInt(a.value, 10), B = parseInt(b.value, 10), S = parseInt(s.value, 10);
        if ([A, B, S].some(isNaN)) { out.appendChild(h('p', { class: 'err' }, 'Βάλε ακέραιους.')); return; }
        out.appendChild(h('pre', { class: 'out' }, 'range(' + A + ', ' + B + ', ' + S + ')'));
        if (S === 0) { out.appendChild(h('div', { class: 'warn' }, 'ValueError: το step δεν μπορεί να είναι 0.')); return; }
        var seq = [], i;
        for (i = A; S > 0 ? i < B : i > B; i += S) { seq.push(i); if (seq.length > 500) break; }
        out.appendChild(h('div', { class: 'formula' }, '[' + seq.slice(0, 60).join(', ') + (seq.length > 60 ? ', …' : '') + ']  →  ' + (seq.length > 500 ? 'πάνω από 500' : seq.length) + ' τιμές'));
        if (!seq.length) out.appendChild(h('p', { class: 'muted' }, 'Η ακολουθία είναι κενή: το ' + (S > 0 ? 'start πρέπει να είναι μικρότερο από το stop' : 'start πρέπει να είναι μεγαλύτερο από το stop για αρνητικό step') + '.'));
        out.appendChild(h('pre', { class: 'out' }, 'total = 0\nfor i in range(' + A + ', ' + B + ', ' + S + '):\n    total = total + i\nprint(total)'));
        var tb = h('table', { class: 'data' }, h('thead', null, h('tr', null, ['Επανάληψη', 'i', 'total πριν', 'total μετά'].map(function (x) { return h('th', null, x); }))));
        var body = h('tbody'), tot = 0;
        seq.slice(0, 40).forEach(function (v, k) {
          body.appendChild(h('tr', null, h('td', { class: 'num' }, k + 1), h('td', { class: 'num' }, v), h('td', { class: 'num' }, tot), h('td', { class: 'num' }, tot + v)));
          tot += v;
        });
        if (seq.length > 40) { for (var k = 40; k < seq.length; k++) tot += seq[k]; }
        tb.appendChild(body); out.appendChild(tb);
        if (seq.length > 40) out.appendChild(h('p', { class: 'muted' }, 'Εμφανίζονται οι πρώτες 40 επαναλήψεις.'));
        out.appendChild(h('p', { class: 'formula' }, 'Τελικό αποτέλεσμα: print(total) → ' + tot));
      }
      [a, b, s].forEach(function (i) { i.addEventListener('input', upd); }); upd();
    }
  });

  /* ---------- 6. Scheduling ---------- */
  TOOLS.push({
    id: 'sched', hue: 25, title: 'Χρονοδρομολόγηση',
    desc: 'FCFS και Round Robin για διεργασίες με χρόνο άφιξης και χρόνο εκτέλεσης. Διάγραμμα Gantt και μέσος χρόνος αναμονής.',
    render: function (box) {
      var procs = [['P1', 0, 5], ['P2', 1, 3], ['P3', 2, 8], ['P4', 3, 6]];
      var tbl = h('table', { class: 'data' }), q = num('s-q', 3, 1), out = h('div');
      function drawTable() {
        clear(tbl);
        tbl.appendChild(h('thead', null, h('tr', null, ['Διεργασία', 'Άφιξη', 'Διάρκεια (burst)', ''].map(function (x) { return h('th', null, x); }))));
        var body = h('tbody');
        procs.forEach(function (p, i) {
          var ai = h('input', { type: 'number', min: 0, value: p[1], 'aria-label': 'Άφιξη ' + p[0], style: 'width:5em' });
          var bi = h('input', { type: 'number', min: 1, value: p[2], 'aria-label': 'Διάρκεια ' + p[0], style: 'width:5em' });
          ai.addEventListener('input', function () { p[1] = Math.max(0, parseInt(ai.value, 10) || 0); upd(); });
          bi.addEventListener('input', function () { p[2] = Math.max(1, parseInt(bi.value, 10) || 1); upd(); });
          body.appendChild(h('tr', null, h('td', { class: 'mono' }, p[0]), h('td', null, ai), h('td', null, bi),
            h('td', null, h('button', { class: 'btn', type: 'button', 'aria-label': 'Διαγραφή ' + p[0], onclick: function () { procs.splice(i, 1); drawTable(); upd(); } }, '✕'))));
        });
        tbl.appendChild(body);
      }
      var addBtn = h('button', { class: 'btn', type: 'button', onclick: function () { procs.push(['P' + (procs.length + 1), 0, 4]); drawTable(); upd(); } }, '+ Διεργασία');
      box.appendChild(tbl);
      box.appendChild(h('div', { class: 'fields', style: 'margin-top:14px' }, addBtn, field('Κβάντο χρόνου (Round Robin)', q, 's-q2')));
      box.appendChild(out);
      var colors = ['#0e7490', '#b45309', '#6d28d9', '#15803d', '#be123c', '#1d4ed8', '#a16207', '#9d174d'];

      function fcfs(ps) {
        var order = ps.map(function (p, i) { return { n: p[0], a: p[1], b: p[2], i: i }; }).sort(function (x, y) { return x.a - y.a || x.i - y.i; });
        var t = 0, segs = [], res = {};
        order.forEach(function (p) {
          if (t < p.a) { segs.push({ n: null, s: t, e: p.a }); t = p.a; }
          segs.push({ n: p.n, i: p.i, s: t, e: t + p.b }); t += p.b;
          res[p.n] = { wait: t - p.a - p.b, turn: t - p.a };
        });
        return { segs: segs, res: res };
      }
      function rr(ps, Q) {
        var list = ps.map(function (p, i) { return { n: p[0], a: p[1], rem: p[2], b: p[2], i: i }; }).sort(function (x, y) { return x.a - y.a || x.i - y.i; });
        var t = 0, segs = [], queue = [], res = {}, next = 0, left = list.length;
        function admit() { while (next < list.length && list[next].a <= t) queue.push(list[next++]); }
        admit();
        while (left > 0) {
          if (!queue.length) { var na = list[next].a; segs.push({ n: null, s: t, e: na }); t = na; admit(); continue; }
          var p = queue.shift(), run = Math.min(Q, p.rem);
          segs.push({ n: p.n, i: p.i, s: t, e: t + run }); t += run; p.rem -= run;
          admit();
          if (p.rem > 0) queue.push(p); else { left--; res[p.n] = { wait: t - p.a - p.b, turn: t - p.a }; }
        }
        return { segs: segs, res: res };
      }
      function show(title, r) {
        var wrap = h('div');
        wrap.appendChild(h('h2', null, title));
        var end = r.segs.length ? r.segs[r.segs.length - 1].e : 0, unit = Math.max(22, Math.min(46, Math.floor(700 / Math.max(end, 1))));
        var g = h('div', { class: 'gantt', role: 'img', 'aria-label': 'Διάγραμμα Gantt' }), ax = h('div', { class: 'gantt-axis' });
        r.segs.forEach(function (s) {
          var w = (s.e - s.s) * unit;
          g.appendChild(h('div', { class: 'seg', style: 'width:' + w + 'px;background:' + (s.n ? colors[s.i % colors.length] : 'repeating-linear-gradient(45deg,#8a97a8,#8a97a8 4px,#aab5c3 4px,#aab5c3 8px)'), title: (s.n || 'αδράνεια') + ' ' + s.s + '–' + s.e }, s.n || ''));
          ax.appendChild(h('span', { style: 'width:' + w + 'px' }, s.s));
        });
        ax.appendChild(h('span', { style: 'border-left:1px solid var(--rule)' }, end));
        wrap.appendChild(h('div', { style: 'overflow-x:auto;max-width:100%' }, h('div', { style: 'width:max-content' }, g, ax)));
        var tb = h('table', { class: 'data', style: 'margin-top:12px' }, h('thead', null, h('tr', null, ['Διεργασία', 'Χρόνος αναμονής', 'Χρόνος ολοκλήρωσης (turnaround)'].map(function (x) { return h('th', null, x); }))));
        var body = h('tbody'), sum = 0, cnt = 0, expr = [];
        procs.forEach(function (p) {
          var x = r.res[p[0]]; if (!x) return;
          sum += x.wait; cnt++; expr.push(x.wait);
          body.appendChild(h('tr', null, h('td', { class: 'mono' }, p[0]), h('td', { class: 'num' }, x.wait), h('td', { class: 'num' }, x.turn)));
        });
        tb.appendChild(body); wrap.appendChild(tb);
        wrap.appendChild(h('p', { class: 'formula' }, 'Μέσος χρόνος αναμονής = (' + expr.join(' + ') + ') / ' + cnt + ' = ' + (cnt ? (sum / cnt).toFixed(2) : '0')));
        return wrap;
      }
      function upd() {
        clear(out);
        if (!procs.length) { out.appendChild(h('p', { class: 'muted' }, 'Πρόσθεσε διεργασίες.')); return; }
        var Q = Math.max(1, parseInt(q.value, 10) || 1);
        out.appendChild(show('FCFS (πρώτος που έρχεται, πρώτος εξυπηρετείται)', fcfs(procs)));
        out.appendChild(show('Round Robin με κβάντο ' + Q, rr(procs, Q)));
        out.appendChild(h('p', { class: 'muted' }, 'Χρόνος αναμονής = χρόνος ολοκλήρωσης − άφιξη − διάρκεια. Στο Round Robin, μια διεργασία που φτάνει ακριβώς όταν λήγει το κβάντο μπαίνει στην ουρά πριν από αυτήν που διακόπηκε.'));
      }
      q.addEventListener('input', upd); drawTable(); upd();
    }
  });

  /* ---------- 7. HTML/CSS lab ---------- */
  TOOLS.push({
    id: 'lab', hue: 340, title: 'Εργαστήριο HTML/CSS',
    desc: 'Γράψε HTML και CSS και δες αμέσως το αποτέλεσμα. Η προεπισκόπηση τρέχει σε απομονωμένο πλαίσιο (χωρίς JavaScript).',
    render: function (box) {
      var starter = '<!DOCTYPE html>\n<html lang="el-GR">\n<head>\n  <meta charset="UTF-8">\n  <title>Η πρώτη μου σελίδα</title>\n  <style>\n    body { font-family: sans-serif; margin: 20px; }\n    h1 { color: teal; }\n    .box {\n      border: 2px solid teal;\n      padding: 10px;\n      margin: 10px 0;\n    }\n  </style>\n</head>\n<body>\n  <h1>Καλημέρα κόσμε</h1>\n  <p class="box">Αυτό είναι <strong>παράγραφος</strong> με κουτί.</p>\n  <ul>\n    <li>HTML = δομή</li>\n    <li>CSS = εμφάνιση</li>\n  </ul>\n</body>\n</html>\n';
      var ta = h('textarea', { class: 'mono', spellcheck: 'false', 'aria-label': 'Κώδικας HTML' });
      ta.value = starter;
      var fr = h('iframe', { title: 'Προεπισκόπηση', sandbox: '' });
      var timer;
      function upd() { fr.srcdoc = ta.value; }
      ta.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(upd, 200); });
      box.appendChild(h('div', { class: 'lab' }, h('div', null, h('p', { class: 'muted' }, 'Κώδικας'), ta), h('div', null, h('p', { class: 'muted' }, 'Αποτέλεσμα'), fr)));
      box.appendChild(h('div', { class: 'row', style: 'margin-top:12px' }, h('button', { class: 'btn', type: 'button', onclick: function () { ta.value = starter; upd(); } }, 'Επαναφορά αρχικού κώδικα')));
      upd();
    }
  });
})();
