# Aster – Google review cards store, v3 (product-page style)

Third storefront for NFC + QR review cards, designed in the style of a modern premium product page
(big centred type, translucent blurred nav, black/white/grey full-bleed sections, rounded bento tiles,
colour picker that recolours a live 3D card, step-by-step order with a live price bag).
It uses its own name and branding; it is not affiliated with any other company.

Plain HTML/CSS/JS, no build step, no dependencies. `config.js` holds brand, contact, sample prices, colours and tiers.
`qr.js` is a self-contained QR encoder. The order step sends nothing: it builds a message to copy or open in the mail app.
