'use strict';
const store = require('../config.js');
const Pricing = require('../lib/pricing.js');
const V = require('../lib/validate.js');

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (c) => (c / 100).toLocaleString('el-GR', { style: 'currency', currency: 'EUR' });
const clip = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);

async function sendMail({ to, subject, html, replyTo }) {
  const key = process.env.RESEND_API_KEY, from = process.env.MAIL_FROM || 'Aster <onboarding@resend.dev>';
  if (!key) return { sent: false, reason: 'no-key' };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], subject, html, reply_to: replyTo })
  });
  return { sent: r.ok, status: r.status };
}
function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (e) { return null; }
}
function orderId() { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return 'AST-' + String(d.getUTCFullYear()).slice(2) + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(); }
module.exports = { store, Pricing, V, esc, eur, clip, sendMail, readJson, orderId };
