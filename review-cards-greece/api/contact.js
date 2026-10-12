'use strict';
const { V, esc, clip, sendMail, readJson } = require('./_lib.js');
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }
  const b = readJson(req);
  if (!b) return res.status(400).json({ ok: false });
  if (b.website) return res.status(200).json({ ok: true, mode: 'demo' });
  const e = {};
  if (!V.name(b.name)) e.name = 'Συμπλήρωσε όνομα.';
  if (!V.email(b.email)) e.email = 'Το email δεν είναι έγκυρο.';
  if (V.name(b.phone) && !V.phone(b.phone)) e.phone = 'Μη έγκυρο τηλέφωνο.';
  if (clip(b.message, 3000).length < 5) e.message = 'Γράψε ένα μήνυμα.';
  if (!b.consent) e.consent = 'Χρειάζεται η συγκατάθεσή σου.';
  if (Object.keys(e).length) return res.status(422).json({ ok: false, errors: e });
  const owner = process.env.ORDER_EMAIL_TO;
  if (!process.env.RESEND_API_KEY || !owner) return res.status(200).json({ ok: true, mode: 'demo' });
  const html = `<div style="font-family:Arial,sans-serif"><h3>Νέο μήνυμα (${esc(clip(b.topic, 40) || 'Γενικό')})</h3><p>${esc(clip(b.name, 120))} · ${esc(clip(b.email, 254))} · ${esc(clip(b.phone, 30))}${b.company ? ' · ' + esc(clip(b.company, 120)) : ''}</p><p>${esc(clip(b.message, 3000)).replace(/\n/g, '<br>')}</p></div>`;
  const r = await sendMail({ to: owner, subject: 'Μήνυμα από τον ιστότοπο', html, replyTo: clip(b.email, 254) }).catch(() => ({ sent: false }));
  return r.sent ? res.status(200).json({ ok: true, mode: 'live' }) : res.status(502).json({ ok: false, error: 'Δεν στάλθηκε το μήνυμα.' });
};
