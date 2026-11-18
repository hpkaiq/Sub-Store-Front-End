const encoder = new TextEncoder();

async function hasValidCredentials(request, password) {
    const authorization = request.headers.get("Authorization") ?? "";
    const credentials = /^Basic[ \t]+([A-Za-z0-9+/]+={0,2})$/i.exec(authorization);
    if (!credentials) return false;

    let supplied;
    try {
        supplied = Uint8Array.from(atob(credentials[1]), (char) => char.charCodeAt(0));
    } catch {
        return false;
    }

    const [actual, expected] = await Promise.all([
        crypto.subtle.digest("SHA-256", supplied),
        crypto.subtle.digest("SHA-256", encoder.encode(`substore:${password}`)),
    ]);
    return crypto.subtle.timingSafeEqual(actual, expected);
}

export async function onRequest({ request, env, next }) {
    const password = env.SITE_PASSWORD;
    if (!password) {
        return new Response("Site password is not configured.", {
            status: 503,
            headers: { "Cache-Control": "no-store" },
        });
    }

    if (!(await hasValidCredentials(request, password))) {
        return new Response("Authentication required.", {
            status: 401,
            headers: {
                "Cache-Control": "no-store",
                "WWW-Authenticate": 'Basic realm="Sub-Store", charset="UTF-8"',
            },
        });
    }

    const response = await next();
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "private, no-store");
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}
