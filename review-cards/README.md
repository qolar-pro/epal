# StarTap – Google review cards store (static site)

Greek one-page store for NFC + QR cards that open a business's Google review form.
Plain HTML/CSS/JS, no build step, no dependencies, works offline.

- `config.js` – brand, contact email/phone, sample prices, VAT, quantity discounts, shipping. **Edit this first.**
- `qr.js` – self-contained QR generator (byte mode, versions 1–10, ECC L/M/Q/H), verified against an independent decoder.
- The order form does not send anything: it builds a message to copy or open in the mail app (needs `email` in `config.js`).
- No payments are taken on the page. Prices are samples.
- Not affiliated with Google; Google's policies forbid incentivised or filtered review requests (see the FAQ).

Deploy: it is a static folder, so `vercel --prod` from `review-cards/` (or any static host) works.
