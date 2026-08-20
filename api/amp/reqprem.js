export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ status: false, error: 'Method Not Allowed' });
    }

    const { email, link } = req.query;
    const API_BASE = process.env.API_BASE;
    const API_KEY = process.env.API_KEY;

    if (!email || !link) {
        return res.status(400).json({ status: false, error: 'Email dan link wajib diisi' });
    }

    if (!API_BASE || !API_KEY) {
        return res.status(500).json({ status: false, error: 'Server environment variables not configured' });
    }

    try {
        const targetUrl = `${API_BASE}/api/amp/reqprem?apikey=${encodeURIComponent(API_KEY)}&email=${encodeURIComponent(email)}&link=${encodeURIComponent(link)}`;
        const response = await fetch(targetUrl);
        const text = await response.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch (err) {
            return res.status(500).json({ status: false, error: 'API Utama verifikasi mengembalikan non-JSON: ' + text.substring(0, 80) });
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ status: false, error: error.message });
    }
}
