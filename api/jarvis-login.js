'use strict';
/* POST /api/jarvis-login  {password}  ->  {token}
   Memeriksa password admin 2 (variabel ADMIN2_PASSWORD di Vercel) lalu memberi token 12 jam untuk /api/chat. */
const J = require('./_jarvis');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return J.json(res, 405, { error: 'Metode tidak diizinkan.' }); }
  if (!J.sameSite(req)) return J.json(res, 403, { error: 'Permintaan ditolak.' });
  if (!J.adminPassword()) return J.json(res, 503, { error: 'ADMIN2_PASSWORD belum diisi di pengaturan Vercel.' });
  const ip = J.clientIp(req), k = 'l|' + ip;
  if (J.limited(k, 5, 600e3)) return J.json(res, 429, { error: 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.' });
  const b = await J.readBody(req);
  const pw = typeof b.password === 'string' ? b.password : '';
  if (!pw || !J.safeEqual(pw, J.adminPassword())) {
    J.bump(k);
    return J.json(res, 401, { error: 'Password admin 2 tidak cocok dengan ADMIN2_PASSWORD di Vercel.' });
  }
  return J.json(res, 200, { token: J.makeToken() });
};
