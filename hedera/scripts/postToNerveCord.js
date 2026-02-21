/**
 * POST a log entry to Nerve-Cord. Entries with tags audit, proposal, consensus, or execution are pinned to 0G.
 * @param {object} opts - { from, text, tags: string[], details?: object }
 * @returns {Promise<{ cid?: string, id?: string }|null>}
 */
async function postToNerveCord(opts) {
    const base = process.env.NERVE_CORD_SERVER || process.env.NERVE_SERVER || "http://localhost:9999";
    const token = process.env.NERVE_CORD_TOKEN || process.env.NERVE_TOKEN;
    if (!token) return null;
    const http = require("http");
    const https = require("https");
    const url = new URL(base);
    const isHttps = url.protocol === "https:";
    const body = JSON.stringify({
        from: opts.from,
        text: opts.text,
        tags: opts.tags || [],
        details: opts.details || undefined,
    });
    const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: "/log",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
            Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
    };
    return new Promise((resolve) => {
        const mod = isHttps ? https : http;
        const req = mod.request(options, (res) => {
            let data = "";
            res.on("data", (ch) => (data += ch));
            res.on("end", () => {
                if (res.statusCode === 201) {
                    try {
                        const parsed = JSON.parse(data);
                        resolve({ cid: parsed.cid, id: parsed.id });
                    } catch {
                        resolve({});
                    }
                } else resolve(null);
            });
        });
        req.on("error", () => resolve(null));
        req.on("timeout", () => { req.destroy(); resolve(null); });
        req.end(body);
    });
}

module.exports = { postToNerveCord };
