export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ status: false, error: 'Method Not Allowed' });
    }

    const email = req.query.email || (req.body && req.body.email);
    const link = req.query.link || (req.body && req.body.link);
    const apikey = req.query.apikey || (req.body && req.body.apikey);

    const API_BASE = process.env.API_BASE;
    const API_KEY = apikey || process.env.API_KEY;

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
            return res.status(500).json({ status: false, error: 'API utama mengembalikan respons non-JSON: ' + text.substring(0, 100) });
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ status: false, error: error.message });
    }
}
