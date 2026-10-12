# Launch checklist (what is NOT done yet)

The site is a working storefront in **demo mode** (`demo: true` in `config.js`): browsing, designer, cart, checkout validation and pricing all work,
but orders are not recorded until the items below are done. Nothing here was verified against real accounts.

## 1. Company data (legally required for a Greek online shop)
Edit `config.js` → `company` and `site`, then run `node scripts/build.js` and redeploy. Replace **every** `[...]` placeholder:
company name, ΑΦΜ, ΔΟΥ, ΓΕΜΗ, address, email, phone, hours. Then set `demo: false`.

## 2. Receive orders (required)
In the Vercel project → Settings → Environment Variables:
| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | API key from resend.com (verify your sending domain there) |
| `ORDER_EMAIL_TO` | the inbox that receives orders and contact messages |
| `MAIL_FROM` | e.g. `Aster <orders@yourdomain.gr>` (must be a verified Resend domain) |
Without both `RESEND_API_KEY` and `ORDER_EMAIL_TO` the API stays in demo mode and records nothing.
Orders are only emailed (no database). For higher volume, add a database or a dedicated shop platform.

## 3. Payments
- **Bank transfer / IRIS** and **cash on delivery** work out of the box: fill in `payments.bank` (bank, beneficiary, IBAN).
- **Card** is off (`payments.card.enabled: false`). To enable: create a Stripe account, set `STRIPE_SECRET_KEY` (start with a *test* key), set `enabled: true`.
  Known gap: there is no Stripe webhook, so a card order is emailed as "awaiting payment" and you must confirm payment in the Stripe dashboard.
  Greek providers (e.g. Viva Wallet, Winbank, Alpha e-Commerce) are not integrated.

## 4. Business decisions to confirm with suppliers/accountant
- Real prices, quantity tiers, courier rates and delivery times (`config.js`) are **placeholders**.
- Product specs (sizes, materials, NTAG213 chip) must match what your supplier actually delivers.
- Invoicing: the site collects ΑΦΜ/ΔΟΥ and the invoice-or-receipt choice but **issues no documents**. Connect your accounting/ERP or a certified e-invoicing provider (myDATA obligations apply).
- Island VAT rates, special regimes and B2B/B2C rules: ask your accountant.

## 5. Legal texts
`/oroi-xrisis`, `/aporrito`, `/cookies`, `/epistrofes`, `/apostoles-plirwmes` are **drafts written for this site, not legal advice**.
Have a Greek lawyer review them (consumer law, GDPR, distance selling, personalised goods) before going live. If you add analytics/ads, add a cookie-consent banner first.

## 6. Technical
- Add a custom domain in Vercel, update `site` in `config.js`, rebuild, redeploy (canonical URLs, sitemap, structured data use it).
- `assets/og.png` is a generated preview image; replace it with your own artwork if you like.
- Test one real order end-to-end (with `demo: false`), including the emails and a COD and a bank-transfer case.
- Run `node tests/run.js` after changing prices, validators or the API.

## 7. Product images
All product, hero and "in use" images in `assets/img/` are **3D renders (CGI)**, not photographs, and are captioned as such on the site. They show sample designs.
Replace them with real product photos from your supplier when you have them (keep the file names, or edit `scripts/build.js`).
Source of the renders: `render-src/` (Blender via `bpy`, Cycles; `tex.js` bakes the print artwork, `scene.py` renders, `convert.py` exports JPEGs). The Greek text in the artwork and the sample QR link are fictional.
