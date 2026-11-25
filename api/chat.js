'use strict';
/* GET  /api/chat  -> {ai, auth}  (cek status, tanpa rahasia)
   POST /api/chat  {message, history}  + header X-Jarvis-Token  ->  {reply}
   Kunci Gemini hanya ada di Vercel (GEMINI_API_KEY), tidak pernah dikirim ke browser. */
const J = require('./_jarvis');

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

module.exports = async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY || '';
  if (req.method === 'GET') return J.json(res, 200, { ai: !!key, auth: !!J.adminPassword() });
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return J.json(res, 405, { error: 'Metode tidak diizinkan.' }); }
  if (!J.sameSite(req)) return J.json(res, 403, { error: 'Permintaan ditolak.' });
  if (!key) return J.json(res, 503, { error: 'Jarvis AI belum aktif: GEMINI_API_KEY belum diisi di pengaturan Vercel.' });
  if (!J.adminPassword()) return J.json(res, 503, { error: 'ADMIN2_PASSWORD belum diisi di pengaturan Vercel.' });
  const tok = req.headers['x-jarvis-token'];
  if (!J.checkToken(tok)) return J.json(res, 401, { error: 'Sesi Jarvis belum aktif atau kedaluwarsa. Keluar, lalu masuk lagi sebagai admin 2.' });

  const rk = 'c|' + String(tok).slice(-16);
  if (J.limited(rk, 20, 600e3)) return J.json(res, 429, { error: 'Terlalu banyak pertanyaan. Coba lagi beberapa menit lagi.' });

  const b = await J.readBody(req);
  const message = typeof b.message === 'string' ? b.message.trim() : '';
  if (!message) return J.json(res, 400, { error: 'Pesan tidak boleh kosong.' });
  if (message.length > 1500) return J.json(res, 400, { error: 'Pesan maksimal 1500 karakter.' });

  const contents = [];
  if (Array.isArray(b.history)) {
    for (const h of b.history.slice(-10)) {
      const t = h && typeof h.text === 'string' ? h.text.slice(0, 3000) : '';
      if (t && (h.role === 'user' || h.role === 'model')) contents.push({ role: h.role, parts: [{ text: t }] });
    }
  }
  while (contents.length && contents[0].role !== 'user') contents.shift();
  contents.push({ role: 'user', parts: [{ text: message }] });
  J.bump(rk);

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: J.jarvisPrompt() }] },
        contents,
        generationConfig: { maxOutputTokens: 2048 },
      }),
      signal: AbortSignal.timeout(25e3),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) {
      console.error('Gemini API', r.status, j && j.error && j.error.message);
      const msg = r.status === 429 ? 'Kuota Gemini sedang penuh. Coba lagi sebentar.'
        : (r.status === 400 || r.status === 403) ? 'Kunci Gemini ditolak. Periksa GEMINI_API_KEY di Vercel.'
        : r.status === 404 ? 'Model Gemini tidak ditemukan. Periksa GEMINI_MODEL di Vercel.'
        : 'Sistem Jarvis sedang mengalami gangguan.';
      return J.json(res, r.status === 429 ? 429 : 502, { error: msg });
    }
    const parts = (j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
    const reply = parts.filter((x) => typeof x.text === 'string' && !x.thought).map((x) => x.text).join('').trim();
    return J.json(res, 200, { reply: reply || 'Maaf, saya tidak bisa menjawab itu. Coba pertanyaan lain.' });
  } catch (e) {
    console.error('Gemini fetch gagal:', e && e.message);
    return J.json(res, 504, { error: 'Jarvis tidak merespons. Coba lagi.' });
  }
};
