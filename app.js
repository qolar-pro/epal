/* Β΄ ΕΠΑΛ Πληροφορική — study app. No build step, no dependencies. */
(function () {
  'use strict';

  var COURSES = window.COURSES || [];
  var TOOLS = window.TOOLS || [];
  // `hue` should be a number 0-360; anything else (e.g. a CSS var string) falls back to a per-course default.
  var HUES = [195, 262, 28, 150, 335, 48];
  COURSES.forEach(function (c, n) { if (typeof c.hue !== 'number' || !isFinite(c.hue)) c.hue = HUES[n % HUES.length]; });
  var $app = document.getElementById('app');
  var $menuBtn = document.getElementById('menuBtn');

  /* ---------- helpers ---------- */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
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
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fold(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ς/g, 'σ'); }

  /* ---------- storage (always guarded) ---------- */
  var mem = null;
  function blank() { return { done: {}, best: {}, last: null, hist: [], dk: {} }; }
  function load() {
    if (mem) return mem;
    try {
      var raw = localStorage.getItem('epal.progress');
      mem = raw ? Object.assign(blank(), JSON.parse(raw)) : blank();
    } catch (e) { mem = blank(); }
    return mem;
  }
  function save() { try { localStorage.setItem('epal.progress', JSON.stringify(mem)); } catch (e) { /* storage blocked: keep in memory */ } }
  function ckey(c, i) { return c.id + ':' + c.chapters[i].id; }

  /* ---------- theme ---------- */
  document.getElementById('themeBtn').addEventListener('click', function () {
    var root = document.documentElement;
    var cur = root.getAttribute('data-theme') ||
      (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('epal.theme', next); } catch (e) { }
  });

  /* ---------- menu (phones) ---------- */
  function closeMenu() { document.body.classList.remove('menu-open'); $menuBtn.setAttribute('aria-expanded', 'false'); }
  $menuBtn.addEventListener('click', function () {
    var open = document.body.classList.toggle('menu-open');
    $menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- search form ---------- */
  document.getElementById('searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = document.getElementById('searchInput').value.trim();
    if (q) location.hash = '#/search/' + encodeURIComponent(q);
  });

  /* ---------- progress helpers ---------- */
  function courseProgress(c) {
    var p = load(), n = 0;
    c.chapters.forEach(function (_, i) { if (p.done[ckey(c, i)]) n++; });
    return n;
  }
  function getCourse(id) { return COURSES.filter(function (c) { return c.id === id; })[0]; }

  /* ---------- router ---------- */
  function route() {
    closeMenu();
    var parts = (location.hash || '#/').replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    var main = h('main', { id: 'main', tabindex: '-1' });
    var side = null;
    $app.className = 'shell';
    $menuBtn.hidden = true;
    var nav = 'home';
    if (parts[0] !== 'search') document.getElementById('searchInput').value = '';
    var title = 'Β΄ ΕΠΑΛ Πληροφορική – Μελέτη';

    try {
      if (parts[0] === 'c' && getCourse(parts[1])) {
        var c = getCourse(parts[1]);
        var idx = parts[2] != null && parts[2] !== '' ? parseInt(parts[2], 10) : -1;
        $app.classList.add('with-side');
        $menuBtn.hidden = false;
        side = renderSide(c, idx);
        if (idx >= 0 && c.chapters[idx]) {
          title = c.chapters[idx].title + ' – ' + c.short;
          renderChapter(main, c, idx, parts[3] || 'notes');
        } else {
          title = c.title;
          renderCourse(main, c);
        }
      } else if (parts[0] === 'test') { nav = 'test'; title = 'Τεστ'; renderTest(main); }
      else if (parts[0] === 'tools') { nav = 'tools'; title = 'Εργαλεία'; renderTools(main, parts[1]); }
      else if (parts[0] === 'search') { nav = ''; title = 'Αναζήτηση'; renderSearch(main, parts.slice(1).join('/')); }
      else renderHome(main);
    } catch (err) {
      clear(main);
      main.appendChild(h('p', { class: 'err' }, 'Σφάλμα: ' + err.message));
      if (window.console) console.error(err);
    }

    clear($app);
    if (side) $app.appendChild(side);
    $app.appendChild(main);
    if (side) $app.appendChild(h('div', { class: 'scrim', onclick: closeMenu }));
    document.title = title + (title.indexOf('Β΄ ΕΠΑΛ') < 0 ? ' · Β΄ ΕΠΑΛ' : '');
    Array.prototype.forEach.call(document.querySelectorAll('.topnav a'), function (a) {
      if (a.getAttribute('data-nav') === nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ---------- home ---------- */
  function renderHome(main) {
    var p = load();
    main.appendChild(h('p', { class: 'eyebrow' }, 'Β΄ Εσπερινού ΕΠΑ.Λ. · Τομέας Πληροφορικής'));
    main.appendChild(h('h1', null, 'Μελέτη και αυτοέλεγχος'));
    main.appendChild(h('p', { class: 'notice' }, 'Σύντομες σημειώσεις για μελέτη, δεν αντικαθιστούν τα επίσημα βιβλία. Έλεγξε με τον καθηγητή σου τη διδακτέα ύλη.'));

    if (p.last) {
      var m = p.last.split('|'), c = getCourse(m[0]);
      if (c && c.chapters[+m[1]]) {
        main.appendChild(h('div', { class: 'continue', style: '--h:' + c.hue },
          h('span', null, 'Συνέχισε από: ', h('b', null, c.short + ' · ' + c.chapters[+m[1]].title)),
          h('a', { class: 'btn primary', href: '#/c/' + c.id + '/' + m[1] + '/' + (m[2] || 'notes') }, 'Συνέχεια')));
      }
    }

    var grid = h('div', { class: 'grid' });
    COURSES.forEach(function (c, n) {
      var done = courseProgress(c), total = c.chapters.length;
      grid.appendChild(h('a', { class: 'card', href: '#/c/' + c.id, style: '--h:' + c.hue },
        h('span', { class: 'no' }, 'ΜΑΘΗΜΑ ' + String(n + 1).padStart(2, '0')),
        h('h3', null, c.title),
        h('p', null, c.intro),
        h('div', { class: 'meta' }, h('span', null, plural(total, 'κεφάλαιο', 'κεφάλαια')), h('span', { class: 'mono' }, done + '/' + total)),
        h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': done, 'aria-label': 'Πρόοδος' }, h('i', { style: 'width:' + (total ? 100 * done / total : 0) + '%' }))));
    });
    main.appendChild(grid);

    main.appendChild(h('div', { class: 'row', style: 'margin-top:28px' },
      h('a', { class: 'btn', href: '#/test' }, 'Μικτό τεστ 15 ερωτήσεων'),
      h('a', { class: 'btn', href: '#/tools' }, 'Εργαλεία')));
    main.appendChild(h('footer', { class: 'foot' }, 'Η πρόοδός σου αποθηκεύεται μόνο σε αυτόν τον περιηγητή.'));
  }

  /* ---------- course & sidebar ---------- */
  function renderSide(c, idx) {
    var p = load();
    var ol = h('ol');
    c.chapters.forEach(function (ch, i) {
      ol.appendChild(h('li', null, h('a', { href: '#/c/' + c.id + '/' + i, 'aria-current': i === idx ? 'page' : null },
        h('span', { class: 'num' }, i + 1),
        h('span', null, ch.title),
        p.done[ckey(c, i)] ? h('span', { class: 'tick', 'aria-label': 'ολοκληρώθηκε', title: 'Ολοκληρώθηκε' }, '✓') : null)));
    });
    return h('aside', { class: 'side', style: '--h:' + c.hue, 'aria-label': 'Κεφάλαια' },
      h('a', { class: 'side-back', href: '#/' }, '← Όλα τα μαθήματα'),
      h('p', { class: 'eyebrow' }, 'Μάθημα'),
      h('h2', null, h('a', { href: '#/c/' + c.id, style: 'color:inherit;text-decoration:none' }, c.title)),
      ol);
  }

  function renderCourse(main, c) {
    main.style.setProperty('--h', c.hue);
    main.appendChild(h('p', { class: 'eyebrow' }, c.short));
    main.appendChild(h('h1', null, c.title));
    main.appendChild(h('p', { class: 'measure' }, c.intro));
    var done = courseProgress(c);
    main.appendChild(h('p', { class: 'muted' }, 'Ολοκληρωμένα κεφάλαια: ' + done + ' από ' + c.chapters.length));
    var list = h('div', { class: 'grid', style: 'margin-top:18px' });
    c.chapters.forEach(function (ch, i) {
      var best = load().best[ckey(c, i)];
      list.appendChild(h('a', { class: 'card', href: '#/c/' + c.id + '/' + i, style: '--h:' + c.hue },
        h('span', { class: 'no' }, 'ΚΕΦΑΛΑΙΟ ' + (i + 1)),
        h('h3', null, ch.title),
        h('div', { class: 'meta' },
          h('span', null, load().done[ckey(c, i)] ? '✓ Το έμαθα' : 'Δεν έχει ολοκληρωθεί'),
          h('span', { class: 'mono' }, best != null ? 'Κουίζ ' + best + '%' : ''))));
    });
    main.appendChild(list);
    main.appendChild(h('div', { class: 'row', style: 'margin-top:24px' },
      h('a', { class: 'btn primary', href: '#/test/' + c.id }, 'Τεστ μόνο για αυτό το μάθημα')));
  }

  /* ---------- chapter ---------- */
  var TABS = [['notes', 'Σημειώσεις'], ['terms', 'Όροι'], ['quiz', 'Κουίζ'], ['cards', 'Flashcards']];

  function renderChapter(main, c, idx, tab) {
    var ch = c.chapters[idx];
    if (!TABS.some(function (t) { return t[0] === tab; })) tab = 'notes';
    main.style.setProperty('--h', c.hue);
    var p = load();
    p.last = [c.id, idx, tab].join('|');
    save();

    main.appendChild(h('p', { class: 'eyebrow' }, c.short + ' · Κεφάλαιο ' + (idx + 1)));
    main.appendChild(h('h1', null, ch.title));
    var tabs = h('div', { class: 'tabs', role: 'tablist' });
    TABS.forEach(function (t) {
      tabs.appendChild(h('a', { href: '#/c/' + c.id + '/' + idx + '/' + t[0], role: 'tab', 'aria-selected': t[0] === tab ? 'true' : 'false' }, t[1]));
    });
    main.appendChild(tabs);

    var body = h('div', { role: 'tabpanel' });
    main.appendChild(body);
    if (tab === 'notes') tabNotes(body, c, idx);
    else if (tab === 'terms') tabTerms(body, ch);
    else if (tab === 'quiz') tabQuiz(body, c, idx);
    else tabCards(body, c, idx);

    var nav = h('div', { class: 'row done-bar' });
    if (idx > 0) nav.appendChild(h('a', { class: 'btn', href: '#/c/' + c.id + '/' + (idx - 1) + '/' + tab }, '← Προηγούμενο'));
    if (idx < c.chapters.length - 1) nav.appendChild(h('a', { class: 'btn', href: '#/c/' + c.id + '/' + (idx + 1) + '/' + tab }, 'Επόμενο →'));
    main.appendChild(nav);
  }

  function tabNotes(body, c, idx) {
    var ch = c.chapters[idx], key = ckey(c, idx);
    body.appendChild(h('div', { class: 'notes', html: ch.notes }));
    var btn = h('button', { class: 'btn warm', type: 'button', 'aria-pressed': 'false' });
    function paint() {
      var d = !!load().done[key];
      btn.textContent = d ? '✓ Το έμαθα (πάτα για αναίρεση)' : 'Το έμαθα';
      btn.classList.toggle('on', d);
      btn.setAttribute('aria-pressed', d ? 'true' : 'false');
    }
    btn.addEventListener('click', function () {
      var p = load();
      if (p.done[key]) delete p.done[key]; else p.done[key] = true;
      save(); paint();
      var ticks = document.querySelector('.side');
      if (ticks) { var ns = renderSide(c, idx); ticks.parentNode.replaceChild(ns, ticks); }
    });
    paint();
    body.appendChild(h('div', { class: 'done-bar' }, btn,
      h('a', { class: 'btn', style: 'margin-left:10px', href: '#/c/' + c.id + '/' + idx + '/quiz' }, 'Πάμε στο κουίζ →')));
  }

  function tabTerms(body, ch) {
    var dl = h('dl', { class: 'terms' });
    ch.terms.forEach(function (t) { dl.appendChild(h('dt', null, t[0])); dl.appendChild(h('dd', null, t[1])); });
    body.appendChild(dl);
  }

  /* ---------- quiz engine ---------- */
  // opts: { onDone(score,total), noSave, showSource }
  function runQuiz(box, questions, opts) {
    opts = opts || {};
    var qs = shuffle(questions), i = 0, score = 0, wrong = [];
    function ask() {
      clear(box);
      var q = qs[i], perm = shuffle([0, 1, 2, 3].slice(0, q.o.length)), answered = false;
      var panel = h('div', { class: 'panel' });
      panel.appendChild(h('div', { class: 'qhead' }, h('span', null, 'Ερώτηση ' + (i + 1) + '/' + qs.length),
        h('span', null, opts.showSource && q.src ? q.src : 'Σωστές: ' + score)));
      panel.appendChild(h('p', { class: 'qtext', html: esc(q.q).replace(/`([^`]+)`/g, '<code>$1</code>') }));
      var list = h('div', { class: 'opts', role: 'group', 'aria-label': 'Επιλογές' }), btns = [];
      perm.forEach(function (orig, pos) {
        var b = h('button', { class: 'opt', type: 'button' },
          h('span', { class: 'k' }, 'ΑΒΓΔ'.charAt(pos)),
          h('span', { html: esc(q.o[orig]).replace(/`([^`]+)`/g, '<code>$1</code>') }));
        b.addEventListener('click', function () {
          if (answered) return;
          answered = true;
          var ok = orig === q.a;
          if (ok) score++; else wrong.push(q);
          btns.forEach(function (bb, k) {
            bb.disabled = true;
            if (perm[k] === q.a) bb.classList.add('right');
            else if (k === pos) bb.classList.add('wrong');
          });
          panel.appendChild(h('div', { class: 'explain', role: 'status' },
            h('b', null, ok ? 'Σωστό. ' : 'Λάθος. '), h('span', { html: esc(q.e).replace(/`([^`]+)`/g, '<code>$1</code>') })));
          var last = i === qs.length - 1;
          var nb = h('button', { class: 'btn primary', type: 'button', style: 'margin-top:14px' }, last ? 'Αποτέλεσμα' : 'Επόμενη ερώτηση →');
          nb.addEventListener('click', function () { if (last) finish(); else { i++; ask(); } });
          panel.appendChild(nb);
          nb.focus();
        });
        btns.push(b); list.appendChild(b);
      });
      panel.appendChild(list);
      box.appendChild(panel);
    }
    function finish() {
      clear(box);
      var pct = Math.round(100 * score / qs.length);
      var panel = h('div', { class: 'panel' },
        h('p', { class: 'eyebrow' }, 'Αποτέλεσμα'),
        h('div', { class: 'score-big' }, score + '/' + qs.length + ' · ' + pct + '%'));
      var msg = h('p', null, pct === 100 ? 'Άριστα!' : pct >= 70 ? 'Πολύ καλά. Κοίτα τα λάθη και είσαι έτοιμος/η.' : 'Ξαναδιάβασε τις σημειώσεις και δοκίμασε ξανά.');
      panel.appendChild(msg);
      if (!opts.noSave && opts.onDone) var info = opts.onDone(score, qs.length);
      if (info) panel.appendChild(h('p', { class: 'muted' }, info));
      if (wrong.length) {
        var ul = h('ul', { class: 'review' });
        wrong.forEach(function (q) { ul.appendChild(h('li', null, h('b', { html: esc(q.q).replace(/`([^`]+)`/g, '<code>$1</code>') }), h('br'), h('span', { class: 'muted', html: 'Σωστό: ' + esc(q.o[q.a]).replace(/`([^`]+)`/g, '<code>$1</code>') }))); });
        panel.appendChild(h('h2', null, 'Όσα έκανες λάθος'));
        panel.appendChild(ul);
      }
      var row = h('div', { class: 'row', style: 'margin-top:16px' });
      if (wrong.length) row.appendChild(h('button', { class: 'btn primary', type: 'button', onclick: function () { runQuiz(box, wrong, { noSave: true, showSource: opts.showSource }); } }, 'Επανάληψη των λαθών (' + wrong.length + ')'));
      row.appendChild(h('button', { class: 'btn', type: 'button', onclick: function () { runQuiz(box, questions, opts); } }, 'Νέα προσπάθεια'));
      if (opts.again) row.appendChild(h('button', { class: 'btn', type: 'button', onclick: opts.again }, 'Νέο τεστ'));
      panel.appendChild(row);
      box.appendChild(panel);
    }
    if (!qs.length) { box.appendChild(h('p', null, 'Δεν υπάρχουν ερωτήσεις.')); return; }
    ask();
  }

  function tabQuiz(body, c, idx) {
    var ch = c.chapters[idx], key = ckey(c, idx);
    var best = load().best[key];
    var box = h('div');
    body.appendChild(h('p', { class: 'muted' }, plural(ch.quiz.length, 'ερώτηση', 'ερωτήσεις') + (best != null ? ' · Καλύτερο σκορ: ' + best + '%' : '')));
    body.appendChild(box);
    runQuiz(box, ch.quiz, {
      onDone: function (s, n) {
        var p = load(), pct = Math.round(100 * s / n), old = p.best[key];
        if (old == null || pct > old) { p.best[key] = pct; save(); return old == null ? 'Πρώτο σκορ αποθηκεύτηκε.' : 'Νέο καλύτερο σκορ! (πριν: ' + old + '%)'; }
        save(); return 'Καλύτερο σκορ: ' + old + '%';
      }
    });
  }

  /* ---------- flashcards ---------- */
  function tabCards(body, c, idx) {
    var ch = c.chapters[idx], key = ckey(c, idx), p = load();
    var box = h('div', { class: 'flash-wrap' });
    body.appendChild(box);
    function start(indices) {
      var deck = shuffle(indices), pos = 0, unknown = [], flipped = false;
      function show() {
        clear(box);
        if (pos >= deck.length) return end();
        var t = ch.terms[deck[pos]];
        box.appendChild(h('div', { class: 'qhead' }, h('span', null, 'Κάρτα ' + (pos + 1) + '/' + deck.length), h('span', null, 'Δεν ξέρω: ' + unknown.length)));
        var face = h('button', { class: 'face', type: 'button', 'aria-label': 'Γύρνα την κάρτα' });
        var wrap = h('div', { class: 'flip' }, face);
        function paint() {
          clear(face);
          wrap.classList.toggle('back', flipped);
          if (!flipped) { face.appendChild(h('span', { class: 'side-label' }, 'Όρος')); face.appendChild(h('span', { class: 'big' }, t[0])); }
          else { face.appendChild(h('span', { class: 'side-label' }, 'Ορισμός')); face.appendChild(h('span', { class: 'def' }, t[1])); }
        }
        face.addEventListener('click', function () { flipped = !flipped; paint(); });
        paint();
        box.appendChild(wrap);
        function next(known) {
          var s = load();
          if (known) { s.dk[key] = (s.dk[key] || []).filter(function (x) { return x !== deck[pos]; }); }
          else { unknown.push(deck[pos]); s.dk[key] = (s.dk[key] || []).filter(function (x) { return x !== deck[pos]; }).concat(deck[pos]); }
          save(); pos++; flipped = false; show();
        }
        box.appendChild(h('div', { class: 'row' },
          h('button', { class: 'btn', type: 'button', onclick: function () { next(false); } }, 'Δεν ξέρω'),
          h('button', { class: 'btn primary', type: 'button', onclick: function () { next(true); } }, 'Ξέρω')));
        box.appendChild(h('p', { class: 'muted' }, 'Πάτα την κάρτα για να δεις τον ορισμό.'));
        face.focus();
      }
      function end() {
        box.appendChild(h('div', { class: 'panel' },
          h('p', { class: 'eyebrow' }, 'Τέλος τράπουλας'),
          h('div', { class: 'score-big' }, (deck.length - unknown.length) + '/' + deck.length),
          h('p', null, unknown.length ? 'Έμειναν ' + plural(unknown.length, 'κάρτα', 'κάρτες') + ' στη στοίβα «δεν ξέρω».' : 'Τις ήξερες όλες!'),
          h('div', { class: 'row' },
            unknown.length ? h('button', { class: 'btn primary', type: 'button', onclick: function () { start(unknown); } }, 'Επανάληψη «δεν ξέρω»') : null,
            h('button', { class: 'btn', type: 'button', onclick: function () { start(ch.terms.map(function (_, k) { return k; })); } }, 'Όλες οι κάρτες ξανά'))));
      }
      show();
    }
    var saved = (p.dk[key] || []).filter(function (k) { return k < ch.terms.length; });
    var all = ch.terms.map(function (_, k) { return k; });
    box.appendChild(h('p', null, plural(ch.terms.length, 'κάρτα', 'κάρτες') + ' από τους όρους του κεφαλαίου.'));
    box.appendChild(h('div', { class: 'row' },
      h('button', { class: 'btn primary', type: 'button', onclick: function () { start(all); } }, 'Ξεκίνα όλες'),
      saved.length ? h('button', { class: 'btn warm', type: 'button', onclick: function () { start(saved); } }, 'Μόνο «δεν ξέρω» (' + saved.length + ')') : null));
  }

  /* ---------- test ---------- */
  function renderTest(main) {
    var parts = (location.hash || '').replace(/^#\/?/, '').split('/');
    var pre = parts[1] || 'all';
    main.appendChild(h('p', { class: 'eyebrow' }, 'Αυτοέλεγχος'));
    main.appendChild(h('h1', null, 'Τεστ'));
    var sel = h('select', { id: 'scope' }, h('option', { value: 'all' }, 'Όλα τα μαθήματα'));
    COURSES.forEach(function (c) { sel.appendChild(h('option', { value: c.id }, c.title)); });
    sel.value = getCourse(pre) ? pre : 'all';
    var box = h('div');
    var start = h('button', { class: 'btn primary', type: 'button' }, 'Ξεκίνα τεστ 15 ερωτήσεων');
    var setup = h('div');
    setup.appendChild(h('p', { class: 'measure' }, '15 τυχαίες ερωτήσεις από όλα τα μαθήματα ή από το μάθημα που θα διαλέξεις.'));
    setup.appendChild(h('div', { class: 'fields' }, h('div', { class: 'field' }, h('label', { for: 'scope' }, 'Ύλη'), sel), start));
    main.appendChild(setup);
    main.appendChild(box);

    function begin() {
      var pool = [];
      COURSES.forEach(function (c) {
        if (sel.value !== 'all' && c.id !== sel.value) return;
        c.chapters.forEach(function (ch, i) { ch.quiz.forEach(function (q) { pool.push(Object.assign({ src: c.short + ' · ' + (i + 1) }, q)); }); });
      });
      var qs = shuffle(pool).slice(0, 15);
      var scopeName = sel.value === 'all' ? 'Όλα' : getCourse(sel.value).short;
      setup.style.display = 'none';
      runQuiz(box, qs, {
        showSource: true,
        again: function () { clear(box); setup.style.display = ''; renderHist(); },
        onDone: function (s, n) {
          var p = load();
          p.hist.unshift({ t: Date.now(), scope: scopeName, s: s, n: n });
          p.hist = p.hist.slice(0, 30); save();
          return 'Το αποτέλεσμα αποθηκεύτηκε στο ιστορικό.';
        }
      });
    }
    start.addEventListener('click', begin);

    var histBox = h('div', { style: 'margin-top:30px' });
    main.appendChild(histBox);
    function renderHist() {
      clear(histBox);
      var hist = load().hist;
      histBox.appendChild(h('h2', null, 'Ιστορικό'));
      if (!hist.length) { histBox.appendChild(h('p', { class: 'muted' }, 'Δεν έχεις δώσει ακόμη τεστ.')); return; }
      var tb = h('table', { class: 'data' }, h('thead', null, h('tr', null, h('th', null, 'Ημερομηνία'), h('th', null, 'Ύλη'), h('th', null, 'Σκορ'), h('th', null, '%'))));
      var tbody = h('tbody');
      hist.forEach(function (r) {
        tbody.appendChild(h('tr', null, h('td', null, new Date(r.t).toLocaleString('el-GR')), h('td', null, r.scope), h('td', { class: 'num' }, r.s + '/' + r.n), h('td', { class: 'num' }, Math.round(100 * r.s / r.n) + '%')));
      });
      tb.appendChild(tbody); histBox.appendChild(tb);
    }
    renderHist();
  }

  /* ---------- search ---------- */
  var index = null;
  function buildIndex() {
    if (index) return index;
    index = [];
    var tmp = document.createElement('div');
    COURSES.forEach(function (c) {
      c.chapters.forEach(function (ch, i) {
        tmp.innerHTML = ch.notes;
        var text = tmp.textContent.replace(/\s+/g, ' ');
        index.push({ c: c, i: i, title: ch.title, text: text, terms: ch.terms,
          ft: fold(ch.title), fx: fold(text) });
      });
    });
    return index;
  }
  function snippet(text, q) {
    var f = fold(text), pos = f.indexOf(q);
    if (pos < 0) return text.slice(0, 140);
    var s = Math.max(0, pos - 60), e = Math.min(text.length, pos + q.length + 90);
    var raw = text.slice(s, e), a = pos - s;
    return (s > 0 ? '…' : '') + esc(raw.slice(0, a)) + '<mark>' + esc(raw.slice(a, a + q.length)) + '</mark>' + esc(raw.slice(a + q.length)) + (e < text.length ? '…' : '');
  }
  function renderSearch(main, qraw) {
    var q = fold(qraw.trim());
    document.getElementById('searchInput').value = qraw;
    main.appendChild(h('p', { class: 'eyebrow' }, 'Αναζήτηση'));
    main.appendChild(h('h1', null, '«' + qraw + '»'));
    if (!q) { main.appendChild(h('p', null, 'Γράψε κάτι για αναζήτηση.')); return; }
    var n = 0;
    buildIndex().forEach(function (e) {
      var hits = [];
      if (e.ft.indexOf(q) >= 0) hits.push(['Τίτλος', esc(e.title)]);
      e.terms.forEach(function (t) { if (fold(t[0]).indexOf(q) >= 0 || fold(t[1]).indexOf(q) >= 0) hits.push(['Όρος', '<b>' + esc(t[0]) + '</b>: ' + esc(t[1])]); });
      if (e.fx.indexOf(q) >= 0) hits.push(['Σημειώσεις', snippet(e.text, q)]);
      if (!hits.length) return;
      n++;
      var r = h('div', { class: 'result', style: '--h:' + e.c.hue },
        h('a', { href: '#/c/' + e.c.id + '/' + e.i + '/' + (hits[0][0] === 'Όρος' ? 'terms' : 'notes') }, e.c.short + ' · ' + (e.i + 1) + '. ' + e.title));
      hits.slice(0, 3).forEach(function (x) { r.appendChild(h('div', { class: 'muted' }, h('span', { class: 'tag' }, x[0]), h('span', { html: x[1] }))); });
      main.appendChild(r);
    });
    if (!n) main.appendChild(h('p', null, 'Δεν βρέθηκαν αποτελέσματα.'));
    else main.insertBefore(h('p', { class: 'muted' }, plural(n, 'κεφάλαιο', 'κεφάλαια') + ' με αποτελέσματα'), main.children[2]);
  }

  /* ---------- tools ---------- */
  function renderTools(main, id) {
    var t = TOOLS.filter(function (x) { return x.id === id; })[0];
    if (t) {
      main.appendChild(h('a', { href: '#/tools', class: 'side-back' }, '← Όλα τα εργαλεία'));
      main.appendChild(h('h1', null, t.title));
      if (t.desc) main.appendChild(h('p', { class: 'measure muted' }, t.desc));
      var box = h('div');
      main.appendChild(box);
      t.render(box, { h: h, clear: clear });
      return;
    }
    main.appendChild(h('p', { class: 'eyebrow' }, 'Διαδραστικά'));
    main.appendChild(h('h1', null, 'Εργαλεία'));
    var grid = h('div', { class: 'grid' });
    TOOLS.forEach(function (x, n) {
      grid.appendChild(h('a', { class: 'card', href: '#/tools/' + x.id, style: '--h:' + (x.hue || 195) },
        h('span', { class: 'no' }, 'ΕΡΓΑΛΕΙΟ ' + String(n + 1).padStart(2, '0')), h('h3', null, x.title), h('p', null, x.desc)));
    });
    main.appendChild(grid);
  }

  if (!COURSES.length) $app.textContent = 'Δεν φορτώθηκαν δεδομένα.';
  else route();
})();
