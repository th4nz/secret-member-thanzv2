const DEFAULT_BASE = "https://restapidhan.vercel.app";
const DEFAULT_API_KEY = "dravndesamuel";

function cleanString(value, max = 4000) {
  return String(value ?? "").trim().slice(0, max);
}

function validateEmail(value) {
  const email = cleanString(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "";
  }
  return email;
}

function validateVerificationLink(value) {
  const link = cleanString(value, 4096);
  try {
    const url = new URL(link);
    if (url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function sendJson(res, statusCode, payload) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(statusCode).json(payload);
}

function onlyPost(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { status: false, message: "Method tidak didukung." });
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;

  const email = validateEmail(req.body?.email);
  const link = validateVerificationLink(req.body?.link);

  if (!email) {
    return sendJson(res, 400, {
      status: false,
      message: "Masukkan email yang valid."
    });
  }

  if (!link) {
    return sendJson(res, 400, {
      status: false,
      message: "Masukkan link verifikasi HTTPS yang valid."
    });
  }

  const base = cleanString(process.env.THANZ_API_BASE || DEFAULT_BASE, 1024).replace(/\/+$/, "");
  const apiKey = cleanString(process.env.THANZ_API_KEY || DEFAULT_API_KEY, 64);

  const url = new URL(base + "/api/amp/reqprem");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("email", email);
  url.searchParams.set("link", link);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(28000)
    });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { status: false, message: "Respons server tidak valid." };
    }

    const code = response.ok && data.status !== false ? 200 : Math.max(400, response.status);
    return sendJson(res, code, data);
  } catch (error) {
    return sendJson(res, 502, {
      status: false,
      message: "Tidak dapat terhubung ke layanan API."
    });
  }
}
    return sendJson(res, Number(error.statusCode || 500), {
      status: false,
      message: String(error.message || "Permintaan gagal diproses.")
    });
  }
}
