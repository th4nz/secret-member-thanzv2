export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ status: false, error: 'Method Not Allowed' });
    }

    const { email, link, apikey } = req.query;
    
    // Mengambil dari Vercel Environment Variables
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
        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ status: false, error: error.message });
    }
}
