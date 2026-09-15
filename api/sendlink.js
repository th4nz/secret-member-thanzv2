const GLOBAL_API_KEY = "ISAAW-matchalatte";

/**
 * Endpoint: /api/am/sendlink
 */
export async function sendLinkApi(email) {
    if (!email) {
        throw new Error("Email tujuan wajib diisi!");
    }

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                status: true,
                code: 200,
                message: "Verification link sent successfully to email!",
                apiKeyUsed: GLOBAL_API_KEY,
                targetEmail: email
            });
        }, 600);
    });
}
