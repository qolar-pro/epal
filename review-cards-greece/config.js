/* Store configuration. Public data only: never put API keys here (use Vercel environment variables).
   After editing, run:  node scripts/build.js   (re-generates the static pages), then redeploy. */
(function (root, factory) {
  var cfg = factory();
  if (typeof module === 'object' && module.exports) module.exports = cfg; else root.STORE = cfg;
})(typeof window !== 'undefined' ? window : this, function () {
  return {
    demo: true,                              // true = shows a "demo mode" ribbon. Set to false only when the company data below is real.
    site: "https://aster-greece.vercel.app", // canonical URL (used in sitemap, canonical links, structured data)
    brand: "Aster",
    company: {                               // REQUIRED by Greek e-commerce law on a real site. Replace every [..] placeholder.
      name: "[ΕΠΩΝΥΜΙΑ ΕΤΑΙΡΕΙΑΣ]", afm: "[ΑΦΜ]", doy: "[ΔΟΥ]", gemi: "[Αρ. ΓΕΜΗ]",
      address: "[Οδός, Αριθμός, ΤΚ, Πόλη]", email: "", phone: "", hours: "Δευτέρα–Παρασκευή 09:00–17:00"
    },
    vatRate: 0.24,
    products: [
      { sku: "card",    slug: "aster-card",    name: "Aster Card",    tagline: "Η κάρτα που ζητά την κριτική για σένα.", price: 6.9,  size: "85,6 × 54 mm", material: "PVC 0,76 mm",       short: "Κάρτα PVC με NFC και QR." },
      { sku: "stand",   slug: "aster-stand",   name: "Aster Stand",   tagline: "Στο τραπέζι. Στον πάγκο. Στο ταμείο.",   price: 12.9, size: "105 × 148 mm (A6)", material: "Ακρυλικό 3 mm με βάση", short: "Ακρυλική βάση με NFC και QR." },
      { sku: "sticker", slug: "aster-sticker", name: "Aster Sticker", tagline: "Κολλάει παντού. Διαβάζεται από παντού.", price: 9.5,  size: "50 × 50 mm", material: "Βινύλιο, πακέτο 5 τεμ.", short: "Πακέτο 5 αυτοκόλλητων NFC + QR.", unit: "πακέτο" }
    ],
    discounts: [{ min: 1, rate: 0 }, { min: 10, rate: 0.10 }, { min: 25, rate: 0.15 }, { min: 50, rate: 0.20 }, { min: 100, rate: 0.25 }],
    shipping: {
      productionDays: "3–5 εργάσιμες", freeFrom: 70, freeFromIslands: 120,
      couriers: [
        { id: "acs",    name: "ACS Courier",   mainland: 3.9, islands: 7.5, eta: "1–2 εργάσιμες (νησιά 2–4)" },
        { id: "speedex", name: "Speedex",      mainland: 3.7, islands: 7.2, eta: "1–2 εργάσιμες (νησιά 2–4)" },
        { id: "elta",   name: "ΕΛΤΑ Courier",  mainland: 3.5, islands: 6.9, eta: "1–3 εργάσιμες (νησιά 2–5)" }
      ]
    },
    payments: {
      bank: { enabled: true,  label: "Τραπεζική κατάθεση / IRIS", bank: "[Τράπεζα]", beneficiary: "[Δικαιούχος]", iban: "GR00 0000 0000 0000 0000 0000 000" },
      cod:  { enabled: true,  label: "Αντικαταβολή", fee: 2.0 },
      card: { enabled: false, label: "Πιστωτική / χρεωστική κάρτα" }    // needs STRIPE_SECRET_KEY on the server
    },
    colors: [
      { id: "graphite", name: "Γραφίτης", hex: "#2b2b2e" }, { id: "pine", name: "Πεύκο", hex: "#1f4d3c" },
      { id: "vermilion", name: "Βερμίλιο", hex: "#e8431a" }, { id: "ocean", name: "Ωκεανός", hex: "#0a4a8a" },
      { id: "sand", name: "Άμμος", hex: "#e9dfcf" }, { id: "plum", name: "Δαμάσκηνο", hex: "#5b2a52" }
    ],
    regions: ["Αττική", "Κεντρική Μακεδονία", "Ανατολική Μακεδονία και Θράκη", "Δυτική Μακεδονία", "Ήπειρος", "Θεσσαλία", "Στερεά Ελλάδα", "Δυτική Ελλάδα", "Πελοπόννησος", "Ιόνια Νησιά", "Βόρειο Αιγαίο", "Νότιο Αιγαίο", "Κρήτη"]
  };
});
