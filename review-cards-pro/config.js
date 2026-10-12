/* Edit this file to customise the store. Prices are SAMPLE prices (EUR, excl. VAT). */
window.STORE = {
  brand: "Αστέρι",
  email: "",            // e.g. "orders@yourshop.gr"; if empty the order form shows a copyable summary
  phone: "",
  vatRate: 0.24,
  freeShippingFrom: 60,
  shipping: 3.5,
  discounts: [{ min: 1, rate: 0 }, { min: 10, rate: 0.10 }, { min: 25, rate: 0.15 }, { min: 50, rate: 0.20 }],
  products: [
    { id: "card",     name: "Κάρτα NFC + QR",             price: 6.9,  desc: "Κάρτα PVC 85,6 × 54 mm με τσιπάκι NFC και τυπωμένο QR, με τον σχεδιασμό που φτιάχνεις παραπάνω." },
    { id: "stand",    name: "Βάση τραπεζιού",              price: 12.9, desc: "Ακρυλική βάση για τραπέζι ή πάγκο. Το QR φαίνεται από μακριά." },
    { id: "stickers", name: "Αυτοκόλλητα NFC (πακέτο 5)",  price: 9.5,  desc: "Για ταμείο, τζάμι ή συσκευασίες. Το πιο φθηνό σημείο επαφής." }
  ]
};
