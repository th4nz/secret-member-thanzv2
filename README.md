# Alight Motion Activation — Vercel

Web frontend untuk aktivasi Alight Motion, pembuatan bulk email Premium siap pakai, dan pengecekan inbox Temp Mail melalui API ZNN.

Menu kanan terdiri dari **Utama**, **Bulk**, dan **Baca Email**. Bulk menghasilkan email Alight Motion yang Premium-nya langsung aktif tanpa proses verify. Hasil 1–10 email dapat disalin, sedangkan hasil di atas 10 disiapkan sebagai file `.txt`. Pembaca email hanya mengembalikan link Alight Motion dari pesan terbaru.

Token API tidak pernah dikirim ke browser. Token dibaca oleh Vercel Serverless Function dari Environment Variables lalu diteruskan ke API melalui header:

```http
Authorization: Bearer <AM_TOKEN>
```

## Environment Variables

Tambahkan di **Vercel → Project → Settings → Environment Variables**:

```env
AM_TOKEN=am_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AM_API_BASE=https://api.znn.my.id/alightmotion
TEMPMAIL_API_BASE=https://api.znn.my.id
```

Isi `AM_TOKEN` cukup token mentah yang diawali `am_`. Jangan tambahkan `Bearer` sendiri.

Set untuk **Production** dan **Preview** sesuai kebutuhan, lalu lakukan **Redeploy** setelah mengubah Environment Variables.

`TEMPMAIL_API_BASE` boleh tidak diisi karena nilai default-nya sudah `https://api.znn.my.id`.

`AM_TOKEN_PARAM` tidak dipakai lagi dan boleh dihapus dari Vercel.

## Endpoint internal web

- `POST /api/send`
- `POST /api/verify`
- `POST /api/bulk` body `{ "amount": 1 }`
- `POST /api/inbox` body `{ "email": "alamat@tempmail.com" }`

Serverless function meneruskan request ke:

- `GET https://api.znn.my.id/alightmotion/send?...`
- `GET https://api.znn.my.id/alightmotion/verify?...`
- `GET https://api.znn.my.id/alightmotion/bulk?amount=...`
- `GET https://api.znn.my.id/tempmail-read?email=...`

Token AM hanya dikirim melalui header Authorization oleh Vercel Serverless Function dan tidak dimasukkan ke query URL.

Route `/api/inbox` menyaring respons Temp Mail di server. Browser tidak menerima isi lengkap inbox atau pesan lama.
