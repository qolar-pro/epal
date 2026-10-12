'use strict';
/* Generates the static pages from config.js.  Usage: node scripts/build.js */
const fs = require('fs'), path = require('path');
const S = require('../config.js');
const root = path.join(__dirname, '..');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => n.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' });
const C = S.company, site = S.site.replace(/\/$/, '');
const pages = [];

const NAV = [['/proionta', 'Προϊόντα', 'catalog'], ['/gia-epixeiriseis', 'Για επιχειρήσεις', 'business'], ['/#pos', 'Πώς δουλεύει', ''], ['/epikoinonia', 'Επικοινωνία', 'contact']];
const SCRIPTS = ['/config.js', '/lib/pricing.js', '/lib/validate.js', '/assets/qr.js', '/assets/designer.js', '/assets/app.js', '/assets/pages.js'];

function layout(o) {
  const url = site + (o.slug === 'index' ? '/' : '/' + o.slug);
  const nav = NAV.map((n) => `<li><a href="${n[0]}"${o.nav === n[2] && n[2] ? ' aria-current="page"' : ''}>${n[1]}</a></li>`).join('');
  const payChips = ['bank', 'cod', 'card'].filter((k) => S.payments[k].enabled).map((k) => `<span>${esc(S.payments[k].label)}</span>`).join('');
  const coLine = [C.name, 'ΑΦΜ: ' + C.afm, 'ΔΟΥ: ' + C.doy, 'ΓΕΜΗ: ' + C.gemi, C.address, [C.email, C.phone].filter(Boolean).join(' · ')].filter(Boolean).map(esc).join(' · ');
  return `<!doctype html>
<html lang="el-GR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${url}">
${o.noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="website"><meta property="og:locale" content="el_GR"><meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${site}/assets/og.png">
<meta name="theme-color" content="#000000">
<link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/style.css">
${o.ld ? `<script type="application/ld+json">${JSON.stringify(o.ld)}</script>` : ''}
</head>
<body data-page="${o.page}"${o.sku ? ` data-sku="${o.sku}"` : ''}>
<a class="skip" href="#main">Μετάβαση στο περιεχόμενο</a>
<nav class="gnav" aria-label="Κύρια πλοήγηση"><div class="gnav-in">
  <a class="gnav-brand" href="/" aria-label="${esc(S.brand)}, αρχική"><svg width="14" height="14" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2l4.2 9 9.8 1.3-7.2 6.8 1.8 9.7L16 24l-8.6 4.8 1.8-9.7L2 12.3 11.8 11z" fill="currentColor"/></svg> ${esc(S.brand)}</a>
  <ul class="gnav-links">${nav}</ul>
  <div class="vat-toggle" role="group" aria-label="Εμφάνιση τιμών"><button type="button" data-mode="ex" aria-pressed="true">Χωρίς ΦΠΑ</button><button type="button" data-mode="inc" aria-pressed="false">Με ΦΠΑ</button></div>
  <a class="cart-link" href="/kalathi" aria-label="Καλάθι"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 7h13l-1.5 9H8L6 3H3"/><circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg><span class="cart-count" data-n="0"></span></a>
</div></nav>
<main id="main">
${o.body}
</main>
<footer class="site-foot">
  <div class="foot-grid">
    <div><h4>${esc(S.brand)}</h4><p>Κάρτες, βάσεις και αυτοκόλλητα NFC + QR για κριτικές Google. Για επιχειρήσεις σε όλη την Ελλάδα.</p><div class="foot-pay">${payChips}</div></div>
    <div><h4>Προϊόντα</h4><ul>${S.products.map((p) => `<li><a href="/proionta/${p.slug}">${esc(p.name)}</a></li>`).join('')}<li><a href="/gia-epixeiriseis">Για επιχειρήσεις</a></li></ul></div>
    <div><h4>Πληροφορίες</h4><ul><li><a href="/apostoles-plirwmes">Αποστολές και πληρωμές</a></li><li><a href="/epistrofes">Επιστροφές και ακυρώσεις</a></li><li><a href="/epikoinonia">Επικοινωνία</a></li></ul></div>
    <div><h4>Νομικά</h4><ul><li><a href="/oroi-xrisis">Όροι χρήσης και πώλησης</a></li><li><a href="/aporrito">Πολιτική απορρήτου</a></li><li><a href="/cookies">Cookies</a></li></ul></div>
  </div>
  <p class="foot-co">${coLine}</p>
  <p class="foot-co">Ανεξάρτητη υπηρεσία, χωρίς σύνδεση με την Google LLC. Τα Google και Google Maps είναι εμπορικά σήματα της Google LLC. Οι τιμές αναγράφονται χωρίς ΦΠΑ, εκτός αν επιλέξεις «Με ΦΠΑ». Η τελική τιμή εμφανίζεται στο ταμείο.</p>
</footer>
${SCRIPTS.map((s) => `<script src="${s}"></script>`).join('\n')}
</body>
</html>
`;
}
function add(o) { pages.push(o); }
const field = (id, label, extra = '', hint = '') => `<div class="field"><label for="${id}">${label}</label><input id="${id}" name="${id}" ${extra}><p class="fe" data-for="${id}" role="alert"></p>${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;

/* ===================== HOME ===================== */
const cheapest = Math.min(...S.products.map((p) => p.price));
add({
  slug: 'index', page: 'home', title: `${S.brand} – Κάρτες κριτικών Google για επιχειρήσεις στην Ελλάδα`,
  desc: 'Κάρτες, βάσεις και αυτοκόλλητα NFC και QR που ανοίγουν κατευθείαν τη φόρμα κριτικής της επιχείρησής σου στο Google. Τιμολόγιο, αποστολή σε όλη την Ελλάδα, εκτύπωση με το όνομά σου.',
  ld: { '@context': 'https://schema.org', '@type': 'Organization', name: S.brand, url: site, legalName: C.name, areaServed: 'GR' },
  body: `
<section class="hero" id="top">
  <p class="eyebrow rv">Για επιχειρήσεις στην Ελλάδα</p>
  <h1 class="rv">${esc(S.brand)} Card.</h1>
  <p class="sub rv">Μία κάρτα. Μία κριτική.</p>
  <p class="links rv"><a class="lnk" href="/proionta/aster-card">Μάθε περισσότερα</a><a class="lnk" href="/proionta/aster-card#buy">Αγορά</a></p>
  <figure class="hero-fig rv"><img src="/assets/img/hero-1800.jpg" srcset="/assets/img/hero-900.jpg 900w, /assets/img/hero-1800.jpg 1800w" sizes="(max-width: 1100px) 100vw, 1100px" width="1800" height="1200" alt="Κινητό που αγγίζει κάρτα Aster Card με NFC και QR" fetchpriority="high"><figcaption>Φωτορεαλιστική απεικόνιση 3D. Το σχέδιο στην κάρτα είναι δείγμα.</figcaption></figure>
  <p class="price-line rv">Από <strong data-net="${cheapest}"></strong> <span data-vat-label>+ ΦΠΑ</span> / τεμ.</p>
</section>
<section class="dark statement" aria-labelledby="h-stmt"><h2 id="h-stmt" class="sr">Η ιδέα</h2>
  <p class="words" id="words">Οι ευχαριστημένοι πελάτες υπάρχουν. Αυτό που λείπει είναι ένας εύκολος δρόμος για να το πουν. Η κάρτα τον αφαιρεί από τη μέση: ένα άγγιγμα, μια φόρμα, δύο λέξεις.</p></section>
<section class="light tight" aria-label="Παράδοση και πληρωμή">
  <div class="trust">
    <div class="rv"><b>Παράδοση σε όλη την Ελλάδα</b><span>${S.shipping.couriers.map((c) => esc(c.name)).join(', ')}. Δωρεάν από ${eur(S.shipping.freeFrom)} (χωρίς ΦΠΑ).</span></div>
    <div class="rv"><b>Τιμολόγιο ή απόδειξη</b><span>Με έλεγχο ΑΦΜ στο ταμείο. Τιμές χωρίς ΦΠΑ για επιχειρήσεις.</span></div>
    <div class="rv"><b>Εύκολη πληρωμή</b><span>${['bank', 'cod', 'card'].filter((k) => S.payments[k].enabled).map((k) => esc(S.payments[k].label)).join(' · ')}.</span></div>
    <div class="rv"><b>Έτοιμο σε ${esc(S.shipping.productionDays)}</b><span>Εκτύπωση με το όνομα και το χρώμα σου, προγραμματισμός NFC και έλεγχος link.</span></div>
  </div>
</section>
<section class="gray bento-sec" aria-labelledby="h-bento"><h2 id="h-bento" class="big rv">Μικρή. Έξυπνη. Έτοιμη.</h2>
  <div class="bento">
    <article class="tile rv span2"><p class="k">NFC</p><h3>Άγγιξε και ανοίγει.</h3><p>Το τσιπάκι κρατά το link σου. Δεν χρειάζεται μπαταρία, ούτε εφαρμογή.</p></article>
    <article class="tile rv inv"><p class="stat">0</p><h3>μπαταρίες</h3><p>Ενεργοποιείται από το ίδιο το κινητό.</p></article>
    <article class="tile rv"><p class="stat">1–4<small>cm</small></p><h3>εμβέλεια</h3><p>Πλησίασε το κινητό στην κάρτα.</p></article>
    <article class="tile rv span2"><p class="k">QR</p><h3>Και για όσους δεν έχουν NFC.</h3><p>Η κάμερα του κινητού αρκεί. Ο ίδιος προορισμός, δύο τρόποι να φτάσεις. Το QR ελέγχεται πριν την εκτύπωση.</p></article>
  </div></section>
<section class="light" id="proionta" aria-labelledby="h-prod"><h2 id="h-prod" class="big rv">Διάλεξε το σημείο επαφής.</h2>
  <div class="prod-grid">${S.products.map((p, i) => `<a class="pcard rv" href="/proionta/${p.slug}"><div class="thumb"><img src="/assets/img/${p.sku}-${['graphite', 'pine', 'vermilion'][i % 3]}-450.jpg" width="450" height="450" loading="lazy" alt="${esc(p.name)}: φωτορεαλιστική απεικόνιση 3D"></div><h3>${esc(p.name)}</h3><p class="tag">${esc(p.short)}</p><p class="from">Από <strong data-net="${p.price}"></strong> <span data-vat-label>+ ΦΠΑ</span>${p.unit ? ' / ' + p.unit : ''}</p><span class="lnk">Αγορά</span></a>`).join('')}</div></section>
<section class="gray" aria-labelledby="h-sec"><h2 id="h-sec" class="big rv">Για κάθε επιχείρηση, η σωστή στιγμή.</h2>
  <div class="sectors">
    <article class="sector rv"><h3>Εστίαση</h3><p>Καφέ, εστιατόρια, μπαρ, ζαχαροπλαστεία.</p><p class="where">Βάση στο τραπέζι · κάρτα στον λογαριασμό</p></article>
    <article class="sector rv"><h3>Ξενοδοχεία και ενοικιαζόμενα</h3><p>Οι επισκέπτες από το εξωτερικό βλέπουν τη φόρμα στη γλώσσα του κινητού τους.</p><p class="where">Κάρτα στο check-out · βάση στη ρεσεψιόν</p></article>
    <article class="sector rv"><h3>Ιατρεία και κλινικές</h3><p>Για ιατρικά επαγγέλματα ισχύουν κανόνες δεοντολογίας: έλεγξε τον σύλλογό σου.</p><p class="where">Κάρτα στη γραμματεία</p></article>
    <article class="sector rv"><h3>Ομορφιά και ευεξία</h3><p>Κομμωτήρια, αισθητική, γυμναστήρια.</p><p class="where">Αυτοκόλλητο στον καθρέφτη · κάρτα στο ταμείο</p></article>
    <article class="sector rv"><h3>Συνεργεία και τεχνικοί</h3><p>Ο πελάτης παραλαμβάνει και είναι ευχαριστημένος: ήρθε η ώρα.</p><p class="where">Κάρτα στο κλειδί ή στο τιμολόγιο</p></article>
    <article class="sector rv"><h3>Λιανικό και καταστήματα</h3><p>Πολλά καταστήματα; Κάθε κατάστημα παίρνει το δικό του link.</p><p class="where">Αυτοκόλλητο στο ταμείο · <a href="/gia-epixeiriseis">πολλά καταστήματα</a></p></article>
  </div></section>
<section class="dark how" id="pos" aria-labelledby="h-how"><h2 id="h-how" class="big rv">Τρία δευτερόλεπτα. Τρία βήματα.</h2>
  <ol class="steps"><li class="rv"><span class="n">1</span><h3>Δώσ' την.</h3><p>Στο ταμείο, στην παράδοση, στο τραπέζι. Μετά από μια καλή στιγμή.</p></li><li class="rv"><span class="n">2</span><h3>Άγγιγμα ή σάρωση.</h3><p>Το κινητό ανοίγει κατευθείαν τη φόρμα κριτικής.</p></li><li class="rv"><span class="n">3</span><h3>Αστέρια και δύο λέξεις.</h3><p>Η κριτική γράφεται εκεί και τότε, πριν ξεχαστεί.</p></li></ol>
  <p class="links"><a class="lnk" href="/proionta">Δες τα προϊόντα</a></p></section>
<section class="light faq" aria-labelledby="h-faq"><h2 id="h-faq" class="big">Ερωτήσεις.</h2><div class="faq-list">
  <details><summary>Μπορώ να ζητώ κριτικές με κάρτες;</summary><p>Ναι. Οι πολιτικές της Google όμως απαγορεύουν αντάλλαγμα (έκπτωση, δώρο) για κριτική και το να ζητάς κριτική μόνο από ικανοποιημένους πελάτες. Ζήτα την από όλους. Δεν εγγυόμαστε αριθμό κριτικών.</p></details>
  <details><summary>Βγάζετε τιμολόγιο;</summary><p>Ναι. Στο ταμείο διαλέγεις τιμολόγιο, βάζεις ΑΦΜ (ελέγχεται αυτόματα), ΔΟΥ και δραστηριότητα. Οι τιμές εμφανίζονται χωρίς ΦΠΑ και το ΦΠΑ ${Math.round(S.vatRate * 100)}% προστίθεται στο ταμείο.</p></details>
  <details><summary>Στέλνετε στα νησιά;</summary><p>Ναι, σε όλη την Ελλάδα. Για νησιά ισχύει άλλη χρέωση και άλλο όριο δωρεάν μεταφορικών. Δες τις <a href="/apostoles-plirwmes">αποστολές και πληρωμές</a>.</p></details>
  <details><summary>Δουλεύει με iPhone και Android;</summary><p>Το QR δουλεύει σε όλα. Το NFC δουλεύει σε Android με ενεργό NFC και σε iPhone XS και νεότερα.</p></details>
  <details><summary>Αν αλλάξει το link μου;</summary><p>Το τυπωμένο QR δεν αλλάζει. Αν θέλεις ευελιξία, βάλε ένα δικό σου σύντομο link που ανακατευθύνει στο Google και άλλαξε προορισμό όποτε θες.</p></details>
</div></section>`
});

/* ===================== CATALOG ===================== */
add({
  slug: 'proionta', page: 'catalog', nav: 'catalog', title: `Προϊόντα – ${S.brand}`, desc: 'Κάρτες, βάσεις τραπεζιού και αυτοκόλλητα NFC και QR για κριτικές Google. Τιμές για επιχειρήσεις, εκπτώσεις ποσότητας.',
  body: `<div class="crumbs"><a href="/">Αρχική</a> › <span aria-current="page">Προϊόντα</span></div>
<header class="page-h"><h1>Προϊόντα.</h1><p class="sub">Τρία σημεία επαφής. Το ίδιο link.</p></header>
<section class="tight"><div class="prod-grid">${S.products.map((p, i) => `<a class="pcard" href="/proionta/${p.slug}"><div class="thumb"><img src="/assets/img/${p.sku}-${['graphite', 'pine', 'vermilion'][i % 3]}-450.jpg" width="450" height="450" loading="lazy" alt="${esc(p.name)}: φωτορεαλιστική απεικόνιση 3D"></div><h3>${esc(p.name)}</h3><p class="tag">${esc(p.tagline)}</p><p>${esc(p.size)} · ${esc(p.material)}</p><p class="from">Από <strong data-net="${p.price}"></strong> <span data-vat-label>+ ΦΠΑ</span>${p.unit ? ' / ' + p.unit : ' / τεμ.'}</p><span class="lnk">Διάλεξε και παράγγειλε</span></a>`).join('')}</div>
<p class="fine" style="margin-top:28px">Εκπτώσεις ποσότητας: ${S.discounts.filter((d) => d.rate).map((d) => `${d.min}+ τεμ. −${Math.round(d.rate * 100)}%`).join(' · ')}. <a href="/gia-epixeiriseis">Πολλά καταστήματα;</a></p></section>`
});

/* ===================== PRODUCT PAGES ===================== */
const USE = { card: 'hero', stand: 'table' };
S.products.forEach((p) => {
  add({
    slug: 'proionta/' + p.slug, page: 'product', sku: p.sku, nav: 'catalog', title: `${p.name} – ${p.short} | ${S.brand}`, desc: `${p.name}: ${p.tagline} ${p.size}, ${p.material}. Εκτύπωση με το όνομά σου, NFC + QR, αποστολή σε όλη την Ελλάδα.`,
    ld: { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.short, brand: { '@type': 'Brand', name: S.brand }, offers: { '@type': 'Offer', priceCurrency: 'EUR', price: p.price.toFixed(2), priceSpecification: { '@type': 'PriceSpecification', price: p.price.toFixed(2), priceCurrency: 'EUR', valueAddedTaxIncluded: false }, availability: 'https://schema.org/InStock', url: `${site}/proionta/${p.slug}`, areaServed: 'GR' } },
    body: `<div class="crumbs"><a href="/">Αρχική</a> › <a href="/proionta">Προϊόντα</a> › <span aria-current="page">${esc(p.name)}</span></div>
<div class="pdp">
  <div class="pdp-stage" id="pdp-stage">
    <div class="pdp-tabs" role="group" aria-label="Προβολή"><button type="button" id="tab-design" aria-pressed="true">Το σχέδιό σου</button><button type="button" id="tab-photo" aria-pressed="false">Προϊόν 3D</button>${USE[p.sku] ? '<button type="button" id="tab-use" aria-pressed="false">Σε χρήση</button>' : ''}</div>
    <div id="pane-design" class="pane"><div id="stage-card"></div></div>
    <div id="pane-photo" class="pane hide"><img id="photo" src="/assets/img/${p.sku}-graphite-900.jpg" width="900" height="900" alt="${esc(p.name)}: φωτορεαλιστική απεικόνιση 3D"></div>
    ${USE[p.sku] ? `<div id="pane-use" class="pane hide"><img id="usephoto" src="/assets/img/${USE[p.sku]}-1800.jpg" width="1800" height="1200" alt="${esc(p.name)} σε χρήση" loading="lazy"></div>` : ''}
    <p class="fine cap" id="stage-cap">Ζωντανή προεπισκόπηση του σχεδίου σου.</p>
  </div>
  <div>
    <h1>${esc(p.name)}</h1><p class="sub">${esc(p.tagline)}</p>
    <p class="price"><span id="p-unit"></span> <span class="fine" id="p-vatl"></span></p><p class="vat-note">Η τιμή αλλάζει με την ποσότητα. Μεταφορικά και ΦΠΑ στο ταμείο.</p>
    <div class="buybox" id="buy">
      <div class="field"><label for="p-name">Όνομα που θα τυπωθεί</label><input id="p-name" type="text" maxlength="40" autocomplete="off" placeholder="π.χ. Καφέ Αστέρι"></div>
      <div class="field"><label for="p-link">Link κριτικής Google</label><input id="p-link" type="url" inputmode="url" spellcheck="false" autocomplete="off" placeholder="https://g.page/r/…/review"></div>
      <p id="p-doctor" class="doctor" role="status"></p>
      <div><span class="fine" style="font-weight:600">Χρώμα: <span id="colorName"></span></span><div class="swatches left" id="swatches" role="group" aria-label="Χρώμα"></div></div>
      <div><label for="p-qty">Ποσότητα</label><div class="qty-row"><div class="stepper"><button type="button" id="qty-dec" aria-label="Λιγότερα">−</button><input id="p-qty" type="number" min="1" max="5000" value="10"><button type="button" id="qty-inc" aria-label="Περισσότερα">+</button></div></div></div>
      <div class="tiers" id="tiers"></div><p class="fine" id="p-tiernote"></p>
      <div class="total-line"><span>Σύνολο</span><span><span id="p-total"></span> <span class="fine" data-vat-label>+ ΦΠΑ</span></span></div>
      <p id="p-msg" class="err" role="alert"></p>
      <button type="button" class="btn block" id="p-add">Προσθήκη στο καλάθι</button>
      <p class="fine">Έλεγχος του link και του σχεδίου πριν την παραγωγή. Παραγωγή: ${esc(S.shipping.productionDays)}. <a href="/gia-epixeiriseis">Πολλά καταστήματα;</a></p>
    </div>
    <table class="specs sum"><tbody><tr><th scope="row">Διαστάσεις</th><td>${esc(p.size)}</td></tr><tr><th scope="row">Υλικό</th><td>${esc(p.material)}</td></tr><tr><th scope="row">NFC</th><td>NTAG213 (144 byte χρήσιμης μνήμης), προγραμματισμένο με το link σου</td></tr><tr><th scope="row">Εμβέλεια</th><td>περίπου 1–4 cm, ανάλογα με το κινητό</td></tr><tr><th scope="row">Συμβατότητα</th><td>QR: όλα τα κινητά. NFC: Android με NFC, iPhone XS και νεότερα</td></tr><tr><th scope="row">Τροφοδοσία</th><td>Καμία (παθητικό τσιπάκι)</td></tr></tbody></table>
    <p class="fine">Οι προδιαγραφές είναι ενδεικτικές και επιβεβαιώνονται με τον προμηθευτή πριν τη λειτουργία του καταστήματος.</p>
  </div>
</div>`
  });
});

/* ===================== BUSINESS ===================== */
const card = S.products[0];
add({
  slug: 'gia-epixeiriseis', page: 'business', nav: 'business', title: `Για επιχειρήσεις και αλυσίδες – ${S.brand}`, desc: 'Πολλά καταστήματα, τιμολόγιο, εκπτώσεις ποσότητας και προσφορά για μεγάλες παραγγελίες. Κάθε κατάστημα με το δικό του link κριτικής.',
  body: `<div class="crumbs"><a href="/">Αρχική</a> › <span aria-current="page">Για επιχειρήσεις</span></div>
<header class="page-h"><h1>Για επιχειρήσεις με πολλά σημεία.</h1><p class="sub">Κάθε κατάστημα, το δικό του link. Μία παραγγελία.</p></header>
<section class="tight light"><h2 class="big">Εκπτώσεις ποσότητας.</h2>
  <div class="tablewrap"><table class="specs" style="max-width:720px;margin:0 auto"><caption class="sr">Εκπτώσεις ποσότητας για ${esc(card.name)}</caption><thead><tr><th scope="col">Ποσότητα</th><th scope="col">Έκπτωση</th><th scope="col">${esc(card.name)} (χωρίς ΦΠΑ)</th></tr></thead><tbody>${S.discounts.map((d, i, a) => `<tr><td>${d.min}${a[i + 1] ? '–' + (a[i + 1].min - 1) : '+'} τεμ.</td><td>${d.rate ? '−' + Math.round(d.rate * 100) + '%' : '—'}</td><td>${eur(Math.round(card.price * 100 * (1 - d.rate)) / 100)}</td></tr>`).join('')}</tbody></table></div>
  <p class="fine">Η έκπτωση υπολογίζεται στη συνολική ποσότητα κάθε προϊόντος στο καλάθι, ακόμη και για διαφορετικά καταστήματα.</p></section>
<section class="gray" aria-labelledby="h-ml"><h2 id="h-ml" class="big">Πολλά καταστήματα με ένα κλικ.</h2>
  <p class="sub">Γράψε ένα κατάστημα ανά γραμμή: όνομα και link κριτικής.</p>
  <div class="ml">
    <div><div class="field"><label for="ml-text">Καταστήματα</label><textarea id="ml-text" rows="9" spellcheck="false">Καφέ Αστέρι Κολωνάκι | https://g.page/r/example1/review
Καφέ Αστέρι Γλυφάδα | https://g.page/r/example2/review
Καφέ Αστέρι Θεσσαλονίκη | https://g.page/r/example3/review</textarea></div>
      <div class="row-3" style="margin-top:12px;grid-template-columns:1fr 1fr 1fr"><div class="field"><label for="ml-sku">Προϊόν</label><select id="ml-sku"></select></div><div class="field"><label for="ml-color">Χρώμα</label><select id="ml-color"></select></div><div class="field"><label for="ml-qty">Τεμάχια ανά κατάστημα</label><input id="ml-qty" type="number" min="1" max="5000" value="25"></div></div>
      <p id="ml-msg" class="fine" role="status"></p><button type="button" class="btn" id="ml-add">Προσθήκη όλων στο καλάθι</button></div>
    <div class="tablewrap"><table class="ml-table" id="ml-table"><thead><tr><th>#</th><th>Κατάστημα</th><th>Έλεγχος link</th></tr></thead><tbody></tbody></table></div>
  </div></section>
<section class="light" aria-labelledby="h-q"><h2 id="h-q" class="big">Ζήτα προσφορά.</h2><p class="sub">Για πάνω από 500 τεμάχια, ειδικά σχέδια ή τμηματική παράδοση.</p>
  <form id="quote" class="narrow co-box" novalidate>
    <div class="row-2">${field('cname', 'Ονοματεπώνυμο', 'type="text" autocomplete="name"')}${field('ccompany', 'Επωνυμία', 'type="text" autocomplete="organization"')}</div>
    <div class="row-2">${field('cemail', 'Email', 'type="email" autocomplete="email"')}${field('cphone', 'Τηλέφωνο', 'type="tel" autocomplete="tel"')}</div>
    <div class="field"><label for="cmessage">Τι χρειάζεσαι (πόσα καταστήματα, ποσότητες, χρονοδιάγραμμα)</label><textarea id="cmessage" name="cmessage" rows="5"></textarea><p class="fe" data-for="cmessage" role="alert"></p></div>
    <div class="hp" aria-hidden="true"><label>Μην συμπληρώσεις<input name="website" tabindex="-1" autocomplete="off"></label></div>
    <div class="check"><input id="cconsent" name="cconsent" type="checkbox"><label for="cconsent">Συμφωνώ να χρησιμοποιηθούν τα στοιχεία μου για να απαντήσετε στο αίτημά μου. <a href="/aporrito">Πολιτική απορρήτου</a>.</label></div><p class="fe" data-for="cconsent" role="alert"></p>
    <p class="form-msg" role="status"></p><p><button class="btn" type="submit">Αποστολή αιτήματος</button></p>
  </form></section>`
});

/* ===================== CART / CHECKOUT / SUCCESS ===================== */
add({ slug: 'kalathi', page: 'cart', title: `Καλάθι – ${S.brand}`, desc: 'Το καλάθι σου.', noindex: true, body: `<div class="crumbs"><a href="/">Αρχική</a> › <span aria-current="page">Καλάθι</span></div><header class="page-h"><h1>Το καλάθι σου.</h1></header><div class="cart-wrap" id="cart-root"></div>` });
add({
  slug: 'tameio', page: 'checkout', title: `Ταμείο – ${S.brand}`, desc: 'Ολοκλήρωση παραγγελίας.', noindex: true,
  body: `<div class="crumbs"><a href="/">Αρχική</a> › <a href="/kalathi">Καλάθι</a> › <span aria-current="page">Ταμείο</span></div><header class="page-h"><h1>Ταμείο.</h1></header>
<div class="co-wrap"><form id="co" novalidate>
  <div class="co-box"><h2>Στοιχεία επικοινωνίας</h2>${field('name', 'Ονοματεπώνυμο', 'type="text" autocomplete="name"')}<div class="row-2">${field('email', 'Email', 'type="email" autocomplete="email"')}${field('phone', 'Τηλέφωνο', 'type="tel" autocomplete="tel" placeholder="69xxxxxxxx"')}</div></div>
  <div class="co-box"><h2>Παραστατικό</h2><div class="radio-list"><label class="radio"><input type="radio" name="invoice" value="receipt" checked><span><b>Απόδειξη</b><small>Λιανικής, χωρίς στοιχεία επιχείρησης</small></span></label><label class="radio"><input type="radio" name="invoice" value="invoice"><span><b>Τιμολόγιο</b><small>Με στοιχεία επιχείρησης</small></span></label></div>
    <div id="inv-fields" style="margin-top:18px" class="hide">${field('company', 'Επωνυμία', 'type="text" autocomplete="organization"')}<div class="row-2">${field('afm', 'ΑΦΜ', 'type="text" inputmode="numeric" maxlength="9" autocomplete="off"', 'Ελέγχεται αυτόματα (9 ψηφία).')}${field('doy', 'ΔΟΥ', 'type="text"')}</div>${field('activity', 'Δραστηριότητα', 'type="text" placeholder="π.χ. Εστίαση"')}</div></div>
  <div class="co-box"><h2>Αποστολή</h2>${field('address', 'Διεύθυνση (οδός και αριθμός)', 'type="text" autocomplete="street-address"')}<div class="row-3">${field('tk', 'ΤΚ', 'type="text" inputmode="numeric" maxlength="6" autocomplete="postal-code"')}${field('city', 'Πόλη', 'type="text" autocomplete="address-level2"')}<div class="field"><label for="region">Περιφέρεια</label><select id="region" name="region"><option value="">Διάλεξε…</option></select><p class="fe" data-for="region" role="alert"></p></div></div>
    <div class="check" style="margin-bottom:16px"><input id="island" name="island" type="checkbox"><label for="island">Η διεύθυνση είναι σε νησί (διαφορετική χρέωση μεταφορικών)</label></div>
    <div class="radio-list" id="ship-list"></div><p class="hint">Παραγωγή: ${esc(S.shipping.productionDays)}, και μετά η μεταφορά.</p></div>
  <div class="co-box"><h2>Πληρωμή</h2><div class="radio-list" id="pay-list"></div></div>
  <div class="co-box"><h2>Σημειώσεις και όροι</h2><div class="field"><label for="notes">Σημειώσεις (π.χ. ώρες παράδοσης, λογότυπο)</label><textarea id="notes" name="notes" rows="3" maxlength="1000"></textarea></div>
    <div class="hp" aria-hidden="true"><label>Μην συμπληρώσεις<input name="website" tabindex="-1" autocomplete="off"></label></div>
    <div class="check"><input id="acceptTerms" name="acceptTerms" type="checkbox"><label for="acceptTerms">Διάβασα και αποδέχομαι τους <a href="/oroi-xrisis" target="_blank" rel="noopener">όρους χρήσης και πώλησης</a> και την <a href="/aporrito" target="_blank" rel="noopener">πολιτική απορρήτου</a>. Κατανοώ ότι τα εξατομικευμένα προϊόντα παράγονται με βάση τα στοιχεία που έδωσα.</label></div><p class="fe" data-for="acceptTerms" role="alert"></p>
    <div class="check" style="margin-top:10px"><input id="marketing" name="marketing" type="checkbox"><label for="marketing">Θέλω να λαμβάνω ενημερώσεις και προσφορές (προαιρετικό).</label></div></div>
</form>
<aside class="card-box aside-sticky"><h2>Η παραγγελία σου</h2><div id="co-sum"></div><p id="co-msg" class="err" role="alert"></p><p><button form="co" type="submit" class="btn block" id="co-submit">Ολοκλήρωση παραγγελίας</button></p><div id="co-result"></div><p class="fine">Με την ολοκλήρωση δημιουργείται η παραγγελία. Η σύμβαση συνάπτεται με την επιβεβαίωσή μας.</p></aside></div>`
});
add({ slug: 'epitixia', page: 'success', title: `Η παραγγελία σου – ${S.brand}`, desc: 'Επιβεβαίωση παραγγελίας.', noindex: true, body: `<header class="page-h"><h1>Ευχαριστούμε.</h1></header><div class="narrow" style="padding:0 22px 80px" id="ok-root"></div>` });

/* ===================== CONTACT ===================== */
add({
  slug: 'epikoinonia', page: 'contact', nav: 'contact', title: `Επικοινωνία – ${S.brand}`, desc: 'Επικοινώνησε μαζί μας για ερωτήσεις, παραγγελίες και προσφορές.',
  body: `<div class="crumbs"><a href="/">Αρχική</a> › <span aria-current="page">Επικοινωνία</span></div><header class="page-h"><h1>Επικοινωνία.</h1><p class="sub">${esc(C.hours)}</p></header>
<section class="tight"><div class="narrow"><p>${esc(C.name)}<br>${esc(C.address)}<br>${C.email ? `Email: <a href="mailto:${esc(C.email)}">${esc(C.email)}</a><br>` : ''}${C.phone ? `Τηλέφωνο: <a href="tel:${esc(C.phone.replace(/\s/g, ''))}">${esc(C.phone)}</a>` : ''}</p>
<form id="contact" class="co-box" novalidate>
  <div class="row-2">${field('cname', 'Ονοματεπώνυμο', 'type="text" autocomplete="name"')}${field('cemail', 'Email', 'type="email" autocomplete="email"')}</div>
  <div class="row-2">${field('cphone', 'Τηλέφωνο (προαιρετικό)', 'type="tel" autocomplete="tel"')}<div class="field"><label for="ctopic">Θέμα</label><select id="ctopic" name="ctopic"><option>Ερώτηση για προϊόν</option><option>Παραγγελία</option><option>Τιμολόγηση</option><option>Άλλο</option></select></div></div>
  <div class="field"><label for="cmessage">Μήνυμα</label><textarea id="cmessage" name="cmessage" rows="5"></textarea><p class="fe" data-for="cmessage" role="alert"></p></div>
  <div class="hp" aria-hidden="true"><label>Μην συμπληρώσεις<input name="website" tabindex="-1" autocomplete="off"></label></div>
  <div class="check"><input id="cconsent" name="cconsent" type="checkbox"><label for="cconsent">Συμφωνώ να χρησιμοποιηθούν τα στοιχεία μου για να απαντήσετε στο μήνυμά μου. <a href="/aporrito">Πολιτική απορρήτου</a>.</label></div><p class="fe" data-for="cconsent" role="alert"></p>
  <p class="form-msg" role="status"></p><p><button class="btn" type="submit">Αποστολή</button></p></form></div></section>`
});

/* ===================== LEGAL ===================== */
const legal = (slug, title, desc, body) => add({ slug, page: 'legal', title: `${title} – ${S.brand}`, desc, body: `<div class="crumbs"><a href="/">Αρχική</a> › <span aria-current="page">${esc(title)}</span></div><header class="page-h"><h1>${esc(title)}</h1><p class="updated">Τελευταία ενημέρωση: ${new Date().toLocaleDateString('el-GR')}</p></header><div class="prose">${body}</div>` });
const seller = `${esc(C.name)}, ΑΦΜ ${esc(C.afm)}, ΔΟΥ ${esc(C.doy)}, ΓΕΜΗ ${esc(C.gemi)}, με έδρα ${esc(C.address)}${C.email ? ', email ' + esc(C.email) : ''}${C.phone ? ', τηλ. ' + esc(C.phone) : ''}`;
legal('oroi-xrisis', 'Όροι χρήσης και πώλησης', 'Όροι χρήσης του ιστότοπου και πώλησης των προϊόντων.', `
<h2>1. Ο πωλητής</h2><p>Ο ιστότοπος και οι πωλήσεις γίνονται από: ${seller} (εφεξής «ο Πωλητής»).</p>
<h2>2. Προϊόντα και τιμές</h2><p>Ο ιστότοπος απευθύνεται κυρίως σε επιχειρήσεις. Οι τιμές αναγράφονται χωρίς ΦΠΑ, εκτός αν επιλέξεις την εμφάνιση «Με ΦΠΑ». Η τελική τιμή, με μεταφορικά και ΦΠΑ ${Math.round(S.vatRate * 100)}%, εμφανίζεται πριν την ολοκλήρωση της παραγγελίας. Οι εκπτώσεις ποσότητας υπολογίζονται στη συνολική ποσότητα κάθε προϊόντος της παραγγελίας.</p>
<h2>3. Παραγγελία και σύναψη σύμβασης</h2><p>Η υποβολή παραγγελίας αποτελεί πρόταση αγοράς. Η σύμβαση συνάπτεται όταν ο Πωλητής επιβεβαιώσει την παραγγελία. Ο Πωλητής μπορεί να αρνηθεί ή να ακυρώσει παραγγελία για βάσιμο λόγο (π.χ. λάθος τιμή, μη έγκυρα στοιχεία), επιστρέφοντας τυχόν καταβληθέν ποσό.</p>
<h2>4. Εξατομικευμένα προϊόντα</h2><p>Τα προϊόντα παράγονται με το όνομα, το χρώμα και το link που δίνει ο πελάτης. Ο πελάτης ευθύνεται για την ορθότητα του link και για το ότι έχει δικαίωμα να χρησιμοποιήσει το όνομα ή το λογότυπο που δίνει. Ο Πωλητής ελέγχει ότι το link είναι έγκυρο https link και ειδοποιεί τον πελάτη αν εντοπίσει πρόβλημα, αλλά δεν δεσμεύεται να επιβεβαιώνει τον προορισμό του.</p>
<h2>5. Πληρωμή</h2><p>Διαθέσιμοι τρόποι: ${['bank', 'cod', 'card'].filter((k) => S.payments[k].enabled).map((k) => esc(S.payments[k].label)).join(', ')}. Με τραπεζική κατάθεση, η παραγωγή ξεκινά μετά την είσπραξη. Με αντικαταβολή προστίθεται επιβάρυνση ${eur(S.payments.cod.fee)} + ΦΠΑ.</p>
<h2>6. Παράδοση</h2><p>Βλέπε <a href="/apostoles-plirwmes">Αποστολές και πληρωμές</a>. Οι χρόνοι είναι εκτιμήσεις και όχι δέσμευση, εκτός αν συμφωνηθεί γραπτώς.</p>
<h2>7. Ακύρωση και επιστροφές</h2><p>Βλέπε <a href="/epistrofes">Επιστροφές και ακυρώσεις</a>.</p>
<h2>8. Εγγύηση και ελαττωματικά προϊόντα</h2><p>Για καταναλωτές ισχύει η νόμιμη εγγύηση για ελαττώματα σύμφωνα με την ισχύουσα νομοθεσία. Για επιχειρήσεις, ο Πωλητής αντικαθιστά χωρίς χρέωση προϊόντα με κατασκευαστικό ελάττωμα (π.χ. τσιπάκι που δεν διαβάζεται) που θα δηλωθούν μέσα σε εύλογο χρόνο από την παραλαβή.</p>
<h2>9. Google και αποτελέσματα</h2><p>Ο Πωλητής δεν συνδέεται με την Google LLC. Ο πελάτης οφείλει να συμμορφώνεται με τις πολιτικές της Google για τις κριτικές (π.χ. να μην προσφέρει αντάλλαγμα για κριτική και να μην ζητά κριτικές επιλεκτικά). Ο Πωλητής δεν εγγυάται αριθμό ή περιεχόμενο κριτικών ούτε βελτίωση βαθμολογίας.</p>
<h2>10. Περιορισμός ευθύνης</h2><p>Στο μέτρο που επιτρέπει ο νόμος, η ευθύνη του Πωλητή περιορίζεται στην αξία των προϊόντων της σχετικής παραγγελίας, εκτός από περιπτώσεις δόλου ή βαριάς αμέλειας και όσα δεν μπορούν να αποκλειστούν από την καταναλωτική νομοθεσία.</p>
<h2>11. Εφαρμοστέο δίκαιο</h2><p>Ισχύει το ελληνικό δίκαιο. Αρμόδια είναι τα δικαστήρια της έδρας του Πωλητή, με την επιφύλαξη των δικαιωμάτων των καταναλωτών. Οι καταναλωτές μπορούν να απευθύνονται και στον <a href="https://www.synigoroskatanaloti.gr" rel="noopener">Συνήγορο του Καταναλωτή</a>.</p>`);
legal('aporrito', 'Πολιτική απορρήτου', 'Πώς επεξεργαζόμαστε τα προσωπικά δεδομένα σου.', `
<h2>Υπεύθυνος επεξεργασίας</h2><p>${seller}.</p>
<h2>Ποια δεδομένα συλλέγουμε</h2><ul><li>Στοιχεία παραγγελίας: ονοματεπώνυμο, email, τηλέφωνο, διεύθυνση αποστολής.</li><li>Στοιχεία τιμολόγησης για επιχειρήσεις: επωνυμία, ΑΦΜ, ΔΟΥ, δραστηριότητα.</li><li>Στοιχεία σχεδιασμού: όνομα επιχείρησης και link κριτικής.</li><li>Μηνύματα που μας στέλνεις μέσω των φορμών επικοινωνίας.</li></ul><p>Δεν συλλέγουμε στοιχεία πληρωμής κάρτας: η πληρωμή με κάρτα γίνεται στον πάροχο πληρωμών.</p>
<h2>Σκοποί και νομικές βάσεις</h2><table><thead><tr><th>Σκοπός</th><th>Νομική βάση</th></tr></thead><tbody><tr><td>Εκτέλεση και παράδοση παραγγελίας</td><td>Εκτέλεση σύμβασης</td></tr><tr><td>Έκδοση παραστατικών, φορολογικές υποχρεώσεις</td><td>Έννομη υποχρέωση</td></tr><tr><td>Απάντηση σε μηνύματα και αιτήματα προσφοράς</td><td>Μέτρα πριν τη σύμβαση / έννομο συμφέρον</td></tr><tr><td>Ενημερώσεις και προσφορές</td><td>Συγκατάθεση (προαιρετική, ανακαλείται ανά πάσα στιγμή)</td></tr></tbody></table>
<h2>Αποδέκτες</h2><p>Εταιρείες μεταφοράς (${S.shipping.couriers.map((c) => esc(c.name)).join(', ')}), πάροχος φιλοξενίας του ιστότοπου, πάροχος αποστολής email, πάροχος πληρωμών (αν επιλέξεις κάρτα), λογιστής και αρχές όπου απαιτείται από το νόμο. Ορισμένοι πάροχοι μπορεί να βρίσκονται εκτός του Ευρωπαϊκού Οικονομικού Χώρου και η διαβίβαση γίνεται με τις προβλεπόμενες από τον ΓΚΠΔ εγγυήσεις.</p>
<h2>Διάρκεια τήρησης</h2><p>Τα παραστατικά διατηρούνται όσο απαιτεί η φορολογική νομοθεσία. Τα μηνύματα επικοινωνίας διατηρούνται για όσο χρειάζεται για να απαντηθούν και για εύλογο διάστημα μετά. Τα δεδομένα marketing διατηρούνται μέχρι να ανακαλέσεις τη συγκατάθεσή σου.</p>
<h2>Τα δικαιώματά σου</h2><p>Έχεις δικαίωμα πρόσβασης, διόρθωσης, διαγραφής, περιορισμού, εναντίωσης και φορητότητας. Στείλε αίτημα στο ${C.email ? esc(C.email) : 'email του υπευθύνου επεξεργασίας'}. Έχεις επίσης δικαίωμα καταγγελίας στην <a href="https://www.dpa.gr" rel="noopener">Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα</a>.</p>
<h2>Cookies και παρακολούθηση</h2><p>Βλέπε <a href="/cookies">Cookies</a>. Ο ιστότοπος δεν χρησιμοποιεί εργαλεία παρακολούθησης ή διαφήμισης.</p>`);
legal('cookies', 'Cookies και τοπική αποθήκευση', 'Τι αποθηκεύει ο ιστότοπος στη συσκευή σου.', `
<p>Ο ιστότοπος δεν χρησιμοποιεί cookies παρακολούθησης, στατιστικών ή διαφήμισης. Χρησιμοποιεί μόνο την τοπική αποθήκευση του περιηγητή (localStorage/sessionStorage), που είναι απαραίτητη για τη λειτουργία του καταστήματος:</p>
<table><thead><tr><th>Κλειδί</th><th>Σκοπός</th><th>Διάρκεια</th></tr></thead><tbody><tr><td>aster.cart</td><td>Περιεχόμενα καλαθιού</td><td>Μέχρι να το αδειάσεις</td></tr><tr><td>aster.last</td><td>Τελευταίο σχέδιο (όνομα, link, χρώμα) για ευκολία</td><td>Μέχρι να το σβήσεις</td></tr><tr><td>aster.vat</td><td>Προτίμηση εμφάνισης τιμών με/χωρίς ΦΠΑ</td><td>Μέχρι να το σβήσεις</td></tr><tr><td>aster.order</td><td>Σύνοψη τελευταίας παραγγελίας για τη σελίδα επιβεβαίωσης</td><td>Μέχρι να κλείσεις την καρτέλα</td></tr></tbody></table>
<p>Αυτά δεν αποστέλλονται σε τρίτους. Μπορείς να τα διαγράψεις από τις ρυθμίσεις του περιηγητή σου. Αν στο μέλλον προστεθούν εργαλεία στατιστικών ή διαφήμισης, θα ζητηθεί προηγουμένως η συγκατάθεσή σου.</p>`);
legal('epistrofes', 'Επιστροφές και ακυρώσεις', 'Πολιτική επιστροφών, ακυρώσεων και ελαττωματικών προϊόντων.', `
<h2>Ακύρωση πριν την παραγωγή</h2><p>Μπορείς να ακυρώσεις την παραγγελία σου χωρίς χρέωση μέχρι να ξεκινήσει η παραγωγή. Επικοινώνησε μαζί μας το συντομότερο στο ${C.email ? esc(C.email) : 'email της εταιρείας'}. Αν έχεις πληρώσει, επιστρέφουμε το ποσό.</p>
<h2>Εξατομικευμένα προϊόντα</h2><p>Τα προϊόντα τυπώνονται με το όνομα και το link που δίνεις. Για καταναλωτές, σύμφωνα με την ισχύουσα νομοθεσία, το δικαίωμα υπαναχώρησης εντός 14 ημερών δεν ισχύει για προϊόντα που κατασκευάζονται σύμφωνα με προδιαγραφές του καταναλωτή. Οι αγορές από επιχειρήσεις για επαγγελματικούς σκοπούς δεν έχουν δικαίωμα υπαναχώρησης.</p>
<h2>Ελαττωματικά ή λάθος προϊόντα</h2><p>Αν παραλάβεις προϊόν με ελάττωμα (π.χ. κακή εκτύπωση, τσιπάκι που δεν διαβάζεται) ή διαφορετικό από την παραγγελία, ενημέρωσέ μας αμέσως με φωτογραφία. Θα το αντικαταστήσουμε ή θα επιστρέψουμε το ποσό και θα καλύψουμε τα έξοδα επιστροφής.</p>
<h2>Λάθος που οφείλεται στα στοιχεία της παραγγελίας</h2><p>Αν το όνομα ή το link που έδωσες ήταν λάθος, η αντικατάσταση χρεώνεται. Γι' αυτό ελέγχουμε το link πριν την παραγωγή και σε ειδοποιούμε.</p>
<h2>Επιστροφή χρημάτων</h2><p>Γίνεται με τον ίδιο τρόπο που πλήρωσες, μέσα σε 14 ημέρες από την αποδοχή της επιστροφής.</p>`);
legal('apostoles-plirwmes', 'Αποστολές και πληρωμές', 'Χρόνοι και κόστος αποστολής, τρόποι πληρωμής και τιμολόγηση.', `
<h2>Χρόνος παραγωγής και αποστολής</h2><p>Παραγωγή: ${esc(S.shipping.productionDays)} από την επιβεβαίωση (και την είσπραξη, αν πληρώνεις με κατάθεση). Μετά ακολουθεί η μεταφορά.</p>
<h2>Μεταφορικά</h2><table><thead><tr><th>Εταιρεία</th><th>Ηπειρωτική (χωρίς ΦΠΑ)</th><th>Νησιά (χωρίς ΦΠΑ)</th><th>Εκτίμηση</th></tr></thead><tbody>${S.shipping.couriers.map((c) => `<tr><td>${esc(c.name)}</td><td>${eur(c.mainland)}</td><td>${eur(c.islands)}</td><td>${esc(c.eta)}</td></tr>`).join('')}</tbody></table>
<p>Δωρεάν μεταφορικά για την ηπειρωτική Ελλάδα από καθαρή αξία ${eur(S.shipping.freeFrom)} και για νησιά από ${eur(S.shipping.freeFromIslands)} (χωρίς ΦΠΑ). Στα μεταφορικά προστίθεται ΦΠΑ.</p>
<h2>Τρόποι πληρωμής</h2><ul>${['bank', 'cod', 'card'].filter((k) => S.payments[k].enabled).map((k) => `<li><b>${esc(S.payments[k].label)}</b>${k === 'cod' ? `: επιβάρυνση ${eur(S.payments.cod.fee)} + ΦΠΑ` : k === 'bank' ? ': τα στοιχεία δίνονται μετά την παραγγελία. Η παραγγελία προχωρά μετά την είσπραξη' : ''}.</li>`).join('')}</ul>
<h2>Παραστατικά</h2><p>Εκδίδεται απόδειξη ή τιμολόγιο σύμφωνα με την επιλογή σου στο ταμείο και τη φορολογική νομοθεσία. Για τιμολόγιο χρειάζονται ΑΦΜ, ΔΟΥ και επωνυμία.</p>`);

/* ===================== 404 ===================== */
add({ slug: '404', page: 'notfound', title: `Η σελίδα δεν βρέθηκε – ${S.brand}`, desc: 'Η σελίδα δεν βρέθηκε.', noindex: true, body: `<header class="page-h"><h1>Η σελίδα δεν βρέθηκε.</h1><p class="sub"><a class="lnk" href="/">Πήγαινε στην αρχική</a></p></header>` });

/* ===================== write files ===================== */
pages.forEach((o) => {
  const file = path.join(root, o.slug + '.html'); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, layout(o));
});
const indexable = pages.filter((p) => !p.noindex && p.slug !== '404');
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((p) => `  <url><loc>${site}${p.slug === 'index' ? '/' : '/' + p.slug}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /kalathi\nDisallow: /tameio\nDisallow: /epitixia\nSitemap: ${site}/sitemap.xml\n`);
fs.writeFileSync(path.join(root, 'assets', 'icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1d1d1f"/><path d="M16 5l3.3 7 7.7 1-5.6 5.4 1.4 7.7L16 22.3 9.2 26.1l1.4-7.7L5 13l7.7-1z" fill="#fff"/></svg>\n');
console.log('built ' + pages.length + ' pages');
