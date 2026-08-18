export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: false, error: 'Method Not Allowed' });
    }

    const API_BASE = process.env.API_BASE;
    const API_KEY = process.env.API_KEY;

    if (!API_BASE || !API_KEY) {
        return res.status(500).json({ status: false, error: 'Environment variables not set' });
    }

    try {
        const domainRes = await fetch('https://api.mail.tm/domains');
        const domainData = await domainRes.json();
        if (!domainData['hydra:member'] || domainData['hydra:member'].length === 0) {
            throw new Error('Gagal mengambil domain mail.tm');
        }
        const domain = domainData['hydra:member'][0].domain;

        const randomStr = Math.random().toString(36).substring(2, 10);
        const email = `am_${randomStr}@${domain}`;
        const password = `Pass_${Math.random().toString(36).substring(2, 12)}!`;

        const createRes = await fetch('https://api.mail.tm/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: email, password: password })
        });
        if (!createRes.ok) throw new Error('Gagal membuat akun email temporer');

        const tokenRes = await fetch('https://api.mail.tm/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: email, password: password })
        });
        const tokenData = await tokenRes.json();
        const token = tokenData.token;
        if (!token) throw new Error('Gagal mendapatkan token email');

        const targetSendUrl = `${API_BASE}/api/am?action=send&apikey=${API_KEY}&email=${encodeURIComponent(email)}`;
        const sendResponse = await fetch(targetSendUrl);
        const sendResult = await sendResponse.json();
        if (!sendResult.status) {
            throw new Error(sendResult.error || 'Gagal mengirim magic link AM');
        }

        let magicLink = null;
        for (let i = 0; i < 6; i++) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const msgRes = await fetch('https://api.mail.tm/messages', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const msgData = await msgRes.json();
            const messages = msgData['hydra:member'];

            if (messages && messages.length > 0) {
                const messageId = messages[0].id;
                const detailRes = await fetch(`https://api.mail.tm/messages/${messageId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const detailData = await detailRes.json();
                
                const textContent = detailData.html || detailData.text || '';
                const urlMatch = textContent.match(/https?:\/\/[^\s"'<>]+?(?:verify|auth|login|am)[^\s"'<>]*?/i) || textContent.match(/https?:\/\/[^\s"'<>]+/);
                
                if (urlMatch) {
                    magicLink = urlMatch[0].replace(/["'>]/g, '');
                    break;
                }
            }
        }

        if (!magicLink) {
            throw new Error('Timeout: Email magic link Alight Motion tidak masuk.');
        }

        const targetVerifUrl = `${API_BASE}/api/am?action=verif&apikey=${API_KEY}&email=${encodeURIComponent(email)}&url=${encodeURIComponent(magicLink)}`;
        const verifResponse = await fetch(targetVerifUrl);
        const verifResult = await verifResponse.json();

        if (verifResult.status) {
            return res.status(200).json({
                status: true,
                message: 'Akun berhasil dibuat dan berhasil di-inject otomatis!',
                email: email
            });
        } else {
            throw new Error(verifResult.error || 'Gagal verifikasi magic link');
        }

    } catch (error) {
        return res.status(500).json({ status: false, error: error.message });
    }
}