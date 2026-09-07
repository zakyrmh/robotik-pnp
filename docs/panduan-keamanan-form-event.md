# Panduan Keamanan Form Pendaftaran Event

**Stack: Node.js (Express) + Supabase (PostgreSQL + Auth + Storage)**

Catatan penting soal stack Anda sebelum masuk ke detail:

- Supabase client (`@supabase/supabase-js`) memakai parameterized query di bawahnya (via PostgREST), jadi **SQL injection klasik sudah tertutup selama Anda tidak menyusun raw SQL string manual**. Yang tetap jadi tanggung jawab Anda: validasi input, XSS, CSRF, rate limit, upload, dsb.
- Supabase punya **Row Level Security (RLS)** — manfaatkan ini sebagai lapisan _least privilege_ di level database, bukan cuma di Express.
- Kalau form ini public (tanpa login), gunakan **Supabase anon key** dengan RLS policy `INSERT`-only yang ketat, JANGAN pakai `service_role` key di endpoint publik.

---

## 1. Validasi Input di Sisi Server

Pakai **Zod** untuk whitelist schema (lebih strict dan type-safe dibanding Joi untuk kasus ini):

```js
// schemas/registration.schema.js
const { z } = require("zod");

const registrationSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z\s'.-]+$/, "Nama hanya boleh huruf dan spasi"),
  email: z.string().trim().email().max(254).toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, "Nomor telepon tidak valid"),
  event_id: z.string().uuid(), // whitelist: harus UUID valid, bukan sembarang string
  registration_date: z.string().datetime(), // ISO 8601 strict
  notes: z.string().trim().max(500).optional(),
});

module.exports = { registrationSchema };
```

```js
// middleware/validate.js
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // Jangan bocorkan detail Zod mentah ke user (lihat poin 7)
      return res.status(400).json({ error: "Input tidak valid" });
    }
    req.validatedBody = result.data; // pakai data yang sudah divalidasi & di-trim
    next();
  };
}
module.exports = { validate };
```

Prinsip: **whitelist, bukan blacklist** — `event_id` harus cocok UUID yang benar-benar ada (cek lagi ke DB, jangan percaya client), field yang tidak didefinisikan di schema otomatis ditolak (`.strict()` di Zod kalau perlu).

---

## 2. Pencegahan Injeksi

| Jenis                 | Mitigasi di stack Anda                                                                                                                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SQL Injection**     | Selalu pakai `supabase.from('table').insert(...)` — jangan pernah `supabase.rpc()` dengan string SQL yang di-concat dari input user. Kalau butuh query kompleks, pakai Postgres function dengan parameter typed, dipanggil via `.rpc('fn_name', { param })`.   |
| **XSS**               | Sanitasi saat **output**, bukan cuma input. Kalau notes/nama ditampilkan di halaman admin: escape HTML (React/JSX otomatis escape; kalau render manual pakai `escape-html` atau DOMPurify di client admin). Set header `Content-Security-Policy` via `helmet`. |
| **Command Injection** | Jangan pernah panggil `child_process.exec()` dengan input user (misal untuk generate PDF tiket, dsb). Kalau perlu shell out, pakai `execFile()` dengan argumen array, bukan string.                                                                            |
| **Path Traversal**    | Untuk nama file upload, jangan pernah pakai `req.body.filename` mentah untuk path. Generate nama sendiri (lihat poin 5).                                                                                                                                       |
| **LDAP/XML**          | Tidak relevan kecuali Anda integrasi SSO korporat — kalau ada, pakai library escape resmi (`ldap-escape`), jangan concat string.                                                                                                                               |

```js
const helmet = require("helmet");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
  }),
);
```

---

## 3. Proteksi CSRF

Poin penting: **cara mitigasi beda tergantung mekanisme auth Anda.**

- **Kalau form public tanpa login** dan submit langsung ke Express via `fetch`/`axios` dari domain sendiri (bukan cookie session) → risiko CSRF rendah, tapi tetap terapkan **SameSite=Lax/Strict** pada semua cookie yang ada, dan cek `Origin`/`Referer` header di server sebagai lapisan tambahan.
- **Kalau ada sesi login** (misal Supabase Auth dengan cookie-based session) → wajib CSRF token.

```js
// middleware/csrf.js — double-submit cookie pattern (works well untuk API publik)
const crypto = require("crypto");

function issueCsrfToken(req, res, next) {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie("csrf_token", token, {
    httpOnly: false, // harus bisa dibaca JS untuk dikirim balik di header
    secure: true,
    sameSite: "strict",
    maxAge: 3600000,
  });
  req.csrfToken = token;
  next();
}

function verifyCsrfToken(req, res, next) {
  const cookieToken = req.cookies["csrf_token"];
  const headerToken = req.headers["x-csrf-token"];
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "CSRF validation failed" });
  }
  next();
}
module.exports = { issueCsrfToken, verifyCsrfToken };
```

Di route: `GET /register` set token → frontend baca cookie, kirim balik via header `X-CSRF-Token` saat `POST /register`.

---

## 4. Rate Limiting dan Anti-Abuse

```js
const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // maks 5 submit per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak percobaan, coba lagi nanti." },
  // pakai Redis store kalau deploy multi-instance (Vercel/serverless butuh ini)
  store: new RedisStore({
    /* redis client config */
  }),
});

app.post("/api/register", registrationLimiter /* ...handlers */);
```

Tambahan:

- **Exponential backoff manual**: simpan `failed_attempts` + `last_attempt_at` per IP/email di tabel Supabase, tolak request kalau `now < last_attempt_at + (2^failed_attempts * base_delay)`.
- **CAPTCHA**: untuk form public rekomendasi **Cloudflare Turnstile** (gratis, lebih ringan & privacy-friendly dibanding reCAPTCHA v3, cocok untuk anti-bot form pendaftaran).
- Deteksi pola otomatis: cek waktu antara "form loaded" dan "form submitted" — kalau < 2 detik, kemungkinan besar bot (lihat poin 9).

---

## 5. Pengamanan Upload File (kalau ada, misal bukti bayar/foto)

Pakai **Supabase Storage**, bukan simpan file di server Express:

```js
const multer = require("multer");
const { fileTypeFromBuffer } = require("file-type");
const sharp = require("sharp");
const crypto = require("crypto");

const upload = multer({
  storage: multer.memoryStorage(), // jangan simpan ke disk lokal dulu
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

async function handleFileUpload(req, res, next) {
  try {
    const file = req.file;
    if (!file) return next();

    // Verifikasi isi file (magic bytes), bukan cuma ekstensi/mimetype dari client
    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !ALLOWED_MIME.includes(detected.mime)) {
      return res.status(400).json({ error: "Tipe file tidak diizinkan" });
    }

    // Re-encode gambar untuk hapus payload/metadata berbahaya (EXIF, embedded script)
    const cleanBuffer = await sharp(file.buffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Nama file acak, TIDAK pakai nama asli dari user
    const randomName = `${crypto.randomUUID()}.jpg`;

    const { data, error } = await req.supabase.storage
      .from("registration-uploads") // bucket private, bukan public
      .upload(randomName, cleanBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) return res.status(500).json({ error: "Upload gagal" });
    req.uploadedFilePath = data.path;
    next();
  } catch (err) {
    next(err);
  }
}
```

- Set bucket **private**, generate signed URL berdurasi pendek untuk admin yang perlu lihat.
- Supabase Storage tidak mengeksekusi file apapun sebagai script — aman secara default, tapi tetap set `Content-Disposition: attachment` saat serve file untuk mencegah browser render HTML/SVG berbahaya kalau ada yang lolos filter.
- Antivirus scan: kalau volume tinggi, integrasikan **ClamAV** via job Supabase Edge Function/queue sebelum file dianggap final.

---

## 6. Keamanan Transport

- Deploy di platform yang HTTPS otomatis (Vercel, Railway, Render, dsb) — TLS 1.2+ default.
- Redirect paksa di Express kalau self-host di belakang load balancer:

```js
app.use((req, res, next) => {
  if (
    req.headers["x-forwarded-proto"] !== "https" &&
    process.env.NODE_ENV === "production"
  ) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});
app.use(
  helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }),
);
```

- Semua data form (termasuk `event_id`) dikirim via **POST body**, jangan pernah lewat query string — Supabase JS client sudah mengikuti ini secara default untuk insert/update.

---

## 7. Penanganan Error yang Aman

```js
// error-handler.js — taruh paling akhir di app.js
app.use((err, req, res, next) => {
  console.error({
    // log detail lengkap ke server/log aggregator
    message: err.message,
    stack: err.stack,
    path: req.path,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Response ke user: generik, tidak pernah expose stack/query/path
  res.status(err.status || 500).json({
    error: "Terjadi kesalahan. Silakan coba lagi nanti.",
  });
});
```

Untuk kasus seperti "email sudah terdaftar": gunakan pesan **konsisten** meski beda kondisi internal, misal cukup "Pendaftaran gagal diproses, periksa kembali data Anda" — hindari membedakan pesan `"email sudah terdaftar"` vs `"event penuh"` kalau itu bisa dipakai untuk enumerasi data pendaftar oleh pihak luar.

---

## 8. Sesi dan Autentikasi (kalau ada login, misal panitia/admin)

- Supabase Auth sudah menangani hashing password & token rotation di baliknya. Yang perlu Anda atur di Express:

```js
res.cookie("sb-access-token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: 3600000,
});
```

- Panggil `supabase.auth.refreshSession()` untuk rotasi token, jangan simpan token lama-lama di client.
- Untuk aksi sensitif (ubah data event, export data pendaftar, hapus pendaftaran) → wajib re-check `supabase.auth.getUser()` di server sebelum eksekusi, jangan percaya session di client saja.
- Terapkan RLS policy di Supabase per role (`admin`, `panitia`, `public`) — ini lapisan otorisasi yang tidak bisa dilewati meskipun ada bug di Express.

---

## 9. Anti-Automation dan Anti-Spam

```js
// Honeypot + timing check
function antiSpamCheck(req, res, next) {
  const { website, form_rendered_at } = req.body; // 'website' = honeypot field tersembunyi via CSS

  if (website && website.trim() !== "") {
    return res.status(200).json({ success: true }); // pura-pura sukses, jangan kasih tahu bot kalau ketahuan
  }

  const elapsed = Date.now() - Number(form_rendered_at);
  if (elapsed < 2000) {
    // submit < 2 detik = kemungkinan besar bot
    return res.status(429).json({ error: "Silakan coba lagi." });
  }
  next();
}
```

Frontend: field `website` di-hide via CSS (`position:absolute; left:-9999px`), bukan `display:none` atau `type="hidden"` (bot scraper canggih bisa deteksi itu). Tambahkan Cloudflare Turnstile untuk lapisan terakhir sebelum submit final.

---

## 10. Audit, Logging, dan Monitoring

Buat tabel log terpisah di Supabase (bukan campur dengan tabel pendaftaran):

```sql
create table registration_audit_log (
  id uuid primary key default gen_random_uuid(),
  ip_address inet,
  user_agent text,
  validation_result text, -- 'success' | 'rejected'
  rejection_reason text,
  created_at timestamptz default now()
);
```

- Jangan log `password`, token, atau nomor kartu — kalau ada field sensitif, mask sebelum log (`****1234`).
- Pakai Supabase log/Postgres trigger atau layanan eksternal (misal Logtail/Datadog) untuk alert kalau ada lonjakan `rejection_reason = 'rate_limited'` dari banyak IP berbeda dalam waktu singkat — indikasi serangan terdistribusi.

---

## 11. Kepatuhan Standar

- Checklist Anda sudah selaras dengan **OWASP ASVS Level 2** — cukup untuk aplikasi yang menangani data personal (nama, email, telepon).
- Least privilege: buat **RLS policy spesifik** per operasi (`insert` untuk anon, `select/update/delete` hanya untuk role admin) — jangan andalkan `service_role` key kecuali di server-side job yang benar-benar butuh bypass RLS.
- Library yang direkomendasikan untuk stack ini: `zod` (validasi), `helmet` (header keamanan), `express-rate-limit` (rate limit), `file-type` + `sharp` (upload), `multer` (parsing multipart) — semua aktif dipelihara dan banyak dipakai di produksi.

---

## Ringkasan Prioritas Implementasi

Kalau harus urutkan berdasarkan risiko vs effort untuk form public seperti ini:

1. **Validasi input (Zod) + rate limiting** — dampak besar, effort kecil, kerjakan duluan.
2. **Honeypot + timing check** — murah, langsung menyaring bot amatir.
3. **CSRF (SameSite + Origin check)** — cepat, terutama kalau nanti ada admin login.
4. **File upload hardening** — kalau form Anda ada upload bukti bayar/foto, ini prioritas tinggi karena risiko RCE.
5. **Turnstile CAPTCHA** — pasang setelah rate limit dasar jalan, sebagai lapisan kedua.
6. **Logging & monitoring** — bangun sejak awal meski sederhana, supaya ada data forensik kalau terjadi insiden.
