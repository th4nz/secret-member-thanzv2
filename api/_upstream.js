const DEFAULT_BASE = "https://restapidhan.vercel.app";
const DEFAULT_API_KEY = "dravndesamuel";

function cleanString(value, max = 4000) {
  return String(value ?? "").trim().slice(0, max);
}

export function validateEmail(value) {
  const email = cleanString(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "";
  }
  return email;
}

export function validateVerificationLink(value) {
  const link = cleanString(value, 4096);

  try {
    const url = new URL(link);
    if (url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function validateApiKey(value) {
  const key = cleanString(value, 64);
  if (!key) return "";
  return key;
}

function sanitize(value, depth = 0) {
  if (depth > 7 || value == null) return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1));
  }

  if (typeof value === "object") {
    const out = {};

    for (const [key, item] of Object.entries(value)) {
      if (/token|secret|authorization|api[_-]?key|credential/i.test(key)) {
        continue;
      }

      out[key] = sanitize(item, depth + 1);
    }

    return out;
  }

  if (typeof value === "string") {
    return value
      .replace(/dravndesamuel/gi, "[hidden]")
      .slice(0, 12000);
  }

  return value;
}

function getApiKey(paramKey) {
  const validParamKey = validateApiKey(paramKey);
  if (validParamKey) return validParamKey;

  const envKey = cleanString(process.env.THANZ_API_KEY || process.env.API_KEY, 64);
  if (envKey) return envKey;

  return DEFAULT_API_KEY;
}

async function callDhanApi(endpoint, params = {}) {
  const base = cleanString(
    process.env.THANZ_API_BASE || process.env.BASE_URL || DEFAULT_BASE,
    1024
  ).replace(/\/+$/, "");

  const apiKey = getApiKey(params.apikey);
  if (!apiKey) {
    return {
      ok: false,
      statusCode: 500,
      data: { status: false, message: "API Key belum diatur di Environment Variables." }
    };
  }

  const url = new URL(base + endpoint);
  url.searchParams.set("apikey", apiKey);

  for (const [key, value] of Object.entries(params)) {
    if (key !== "apikey" && value !== undefined && value !== null && String(value) !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-Key": apiKey,
        "user-agent": "thanz-am-client/1.2"
      },
      redirect: "follow",
      signal: AbortSignal.timeout(28000)
    });
  } catch {
    return {
      ok: false,
      statusCode: 502,
      data: { status: false, message: "Tidak dapat terhubung ke layanan API utama." }
    };
  }

  const raw = await response.text();

  if (raw.trim().toLowerCase().includes("<!doctype html") || raw.includes("<html")) {
    return {
      ok: false,
      statusCode: 502,
      data: {
        status: false,
        message: "API upstream mengembalikan respons HTML. Periksa kembali endpoint atau base URL."
      }
    };
  }

  let data;

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {
      status: false,
      message: "Respons API tidak valid (Bukan JSON)."
    };
  }

  const safeData = sanitize(data);

  return {
    ok: response.ok && safeData && safeData.status !== false,
    statusCode: response.status,
    data: safeData
  };
}

export async function checkApiKeyStatus(apikey) {
  return callDhanApi("/api/key/status", { apikey });
}

export async function sendVerificationLink(email, apikey) {
  return callDhanApi("/api/am/sendlink", { email, apikey });
}

export async function requestPremiumVerification(email, link, apikey) {
  return callDhanApi("/api/amp/reqprem", { email, link, apikey });
}

export function sendJson(res, statusCode, payload) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  return res.status(statusCode).json(payload);
}

export function onlyPost(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    sendJson(res, 405, {
      status: false,
      message: "Method tidak didukung."
    });

    return false;
  }

    return true;
    }
