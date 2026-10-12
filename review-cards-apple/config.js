/* Edit this file to customise the store. Prices are SAMPLE prices (EUR, excl. VAT). */
window.STORE = {
  brand: "Aster",
  email: "",            // e.g. "orders@yourshop.gr"; if empty the order step shows a copyable summary
  phone: "",
  vatRate: 0.24,
  freeShippingFrom: 60,
  shipping: 3.5,
  discounts: [{ min: 1, rate: 0 }, { min: 10, rate: 0.10 }, { min: 25, rate: 0.15 }, { min: 50, rate: 0.20 }],
  products: [
    { id: "card",     name: "Aster Card",    tag: "Η κάρτα",        price: 6.9,  desc: "Κάρτα PVC 85,6 × 54 mm με NFC και QR." },
    { id: "stand",    name: "Aster Stand",   tag: "Η βάση",         price: 12.9, desc: "Ακρυλική βάση τραπεζιού με NFC και QR." },
    { id: "stickers", name: "Aster Sticker", tag: "Το αυτοκόλλητο", price: 9.5,  desc: "Πακέτο 5 αυτοκόλλητων NFC για ταμείο και τζάμι." }
  ],
  colors: [
    { id: "graphite", name: "Γραφίτης", hex: "#2b2b2e" },
    { id: "pine",     name: "Πεύκο",    hex: "#1f4d3c" },
    { id: "vermilion", name: "Βερμίλιο", hex: "#e8431a" },
    { id: "ocean",    name: "Ωκεανός",  hex: "#0a4a8a" },
    { id: "sand",     name: "Άμμος",    hex: "#e9dfcf" },
    { id: "plum",     name: "Δαμάσκηνο", hex: "#5b2a52" }
  ]
};
