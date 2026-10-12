# Αστέρι – Google review cards store, v2 (static site)

Second, more ambitious storefront for NFC + QR review cards. Plain HTML/CSS/JS, no build step, no dependencies.

- **Card studio:** live card designer with link checker, contrast check and QR-density check; exports a print-ready SVG (85.6 × 54 mm + 3 mm bleed). The exported file was verified to decode to the right link.
- **Rating math:** projects the average rating from the owner's own numbers (formula shown, no promised results).
- **Honest comparison**, placement guide, Google-policy do/don't, order calculator (quantity tiers, VAT, shipping).
- The order form sends nothing: it builds a message to copy or open in the mail app.
- `config.js` holds brand, contact, sample prices and tiers. `qr.js` is a self-contained QR encoder (versions 1–10).
