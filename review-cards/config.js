/* Edit this file to customise the store. Prices are SAMPLE prices (EUR, excl. VAT). */
window.STORE = {
  brand: "StarTap",
  email: "",            // e.g. "orders@yourshop.gr". If empty, the order form shows a copyable summary instead of opening your mail app.
  phone: "",            // e.g. "+30 210 0000000"
  vatRate: 0.24,        // Greek standard VAT
  freeShippingFrom: 60, // order total (excl. VAT) with free shipping
  shipping: 3.5,
  discounts: [          // quantity tiers: from `min` pieces, `rate` off the unit price
    { min: 1, rate: 0 },
    { min: 10, rate: 0.10 },
    { min: 25, rate: 0.15 },
    { min: 50, rate: 0.20 }
  ],
  products: [
    { id: "card",    name: "Κάρτα NFC + QR",        price: 6.9,  desc: "Κάρτα PVC μεγέθους πιστωτικής κάρτας με τσιπάκι NFC και τυπωμένο QR." },
    { id: "stand",   name: "Βάση τραπεζιού",         price: 12.9, desc: "Ακρυλική βάση για πάγκο ή τραπέζι, με QR και NFC. Εκτύπωση με το λογότυπό σου." },
    { id: "stickers", name: "Αυτοκόλλητα NFC (πακέτο 5)", price: 9.5, desc: "Πέντε αυτοκόλλητα για ταμείο, τζάμι ή συσκευασίες." }
  ]
};
