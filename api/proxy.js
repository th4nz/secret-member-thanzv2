const API_BASE = 'https://skyp.isaaw.web.id';
const API_KEY = 'ISAAW-matchalatte';

export default async function handler(req, res) {
  const { action, email, link } = req.query || {};

  if (!action) {
    return res.status(400).json({
      creator: 'iSaaw',
      status: false,
      error: 'Parameter action wajib diisi.'
    });
  }

  let target;

  // =========================
  // SEND MAGIC LINK
  // =========================
  if (action === 'sendlink') {
    if (!email) {
      return res.status(400).json({
        creator: 'iSaaw',
        status: false,
        error: 'Parameter email wajib diisi.'
      });
    }

    target =
      `${API_BASE}/api/am/sendlink?email=${encodeURIComponent(email)}`;

  // =========================
  // AKTIVASI PREMIUM
  // =========================
  } else if (action === 'reqprem') {
    if (!email || !link) {
      return res.status(400).json({
        creator: 'iSaaw',
        status: false,
        error: 'Parameter email dan link wajib diisi.'
      });
    }

    target =
      `${API_BASE}/api/amp/reqprem` +
      `?email=${encodeURIComponent(email)}` +
      `&link=${encodeURIComponent(link)}`;

  } else {
    return res.status(404).json({
      creator: 'iSaaw',
      status: false,
      error: 'Action tidak ditemukan.'
    });
  }

  // =========================
  // REQUEST KE API ISAAW
  // =========================
  try {
    const response = await fetch(target, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json'
      }
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        creator: 'iSaaw',
        status: false,
        error: text || `HTTP ${response.status}`
      };
    }

    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(502).json({
      creator: 'iSaaw',
      status: false,
      error: 'Gagal menghubungi API upstream.',
      detail: error.message
    });
  }
}
