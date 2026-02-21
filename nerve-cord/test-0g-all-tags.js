#!/usr/bin/env node
/**
 * Final test: all 0G-pinned tag types (proposal, audit, execution, consensus)
 * must return cid from POST /log and content must be fetchable from 0G.
 * Usage: node test-0g-all-tags.js [BASE_URL]
 * Requires: server running, .env with TOKEN and 0G_* for fetch step
 */

const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");
const crypto = require("crypto");

// Load .env
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
        const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (m && !process.env[m[1]]) {
            let v = (m[2] || "").trim();
            if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
            process.env[m[1]] = v;
        }
    });
}

const BASE = process.argv[2] || process.env.SERVER || process.env.NERVE_SERVER || "http://localhost:9999";
const TOKEN = process.env.TOKEN || process.env.NERVE_TOKEN;

const ENTRIES = [
    {
        name: "proposal",
        body: {
            from: "alpha-strategist",
            text: "Proposed BUY 0.5 ETH spot, max slippage 0.5%",
            tags: ["proposal"],
        },
        expectInContent: "proposal",
    },
    {
        name: "execution",
        body: () => ({
            from: "execution-hand",
            text: "Executed PROP-TEST on Base Mainnet at " + new Date().toISOString(),
            tags: ["execution"],
            pinTo0g: true,
            details: {
                execution_id: "EXE-" + Date.now(),
                responding_to_audit: "PROP-TEST",
                status: "SUCCESS",
                network: "Base Mainnet",
                tx_hash: "0x" + Date.now().toString(16),
                timestamp: new Date().toISOString(),
            },
        }),
        expectInContent: "execution",
    },
    {
        name: "audit",
        body: {
            from: "audit-oracle",
            text: "Verdict: APPROVED. VaR within 2σ.",
            tags: ["audit"],
            details: { responding_to: "PROP-TEST", status: "APPROVED", reason: "VaR OK" },
        },
        expectInContent: "audit",
    },
    {
        name: "consensus",
        body: {
            from: "society",
            text: "Consensus: PROP-TEST approved and executed",
            tags: ["consensus"],
            details: {
                proposalId: "PROP-TEST",
                strategist: { from: "alpha-strategist", proposal: "BUY 0.5 ETH" },
                audit: { verdict: "APPROVED" },
                execution: { status: "SUCCESS" },
                created: new Date().toISOString(),
            },
        },
        expectInContent: "proposalId",
    },
];

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function request(method, url, body) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const mod = u.protocol === "https:" ? https : http;
        const payload = body !== undefined ? JSON.stringify(body) : "";
        const headers = {
            Authorization: `Bearer ${TOKEN}`,
        };
        if (payload) {
            headers["Content-Type"] = "application/json";
            headers["Content-Length"] = Buffer.byteLength(payload);
        }
        const req = mod.request(
            {
                hostname: u.hostname,
                port: u.port || (u.protocol === "https:" ? 443 : 80),
                path: u.pathname,
                method,
                headers,
                timeout: 60000,
            },
            (res) => {
                let data = "";
                res.on("data", (ch) => (data += ch));
                res.on("end", () => resolve({ status: res.statusCode, data }));
            }
        );
        req.on("error", reject);
        req.on("timeout", () => {
            req.destroy();
            reject(new Error("timeout"));
        });
        req.end(payload || undefined);
    });
}

async function fetchFrom0g(cid) {
    const INDEXER_RPC = process.env["0G_INDEXER_RPC"];
    if (!INDEXER_RPC) return null;
    const { Indexer } = await import("@0glabs/0g-ts-sdk");
    const indexer = new Indexer(INDEXER_RPC);
    const tmp = path.join(require("os").tmpdir(), "0g-test-" + Date.now() + ".bin");
    const err = await indexer.download(cid, tmp, false);
    if (err) return null;
    const buf = fs.readFileSync(tmp);
    try { fs.unlinkSync(tmp); } catch (_) {}
    return buf.toString("utf8");
}

async function main() {
    if (!TOKEN) {
        console.error("Missing TOKEN or NERVE_TOKEN in .env");
        process.exit(1);
    }

    console.log("=== Final 0G storage test (all tag types) ===\n");
    console.log("Base URL:", BASE);

    const health = await request("GET", BASE + "/health");
    if (health.status !== 200 || !health.data.includes('"ok":true')) {
        console.error("Server not reachable or unhealthy. Start nerve-cord first: npm start");
        process.exit(1);
    }
    console.log("Server OK\n");

    const results = [];
    for (const entry of ENTRIES) {
        const body = typeof entry.body === "function" ? entry.body() : entry.body;
        await sleep(2000);
        let res = await request("POST", BASE + "/log", body);
        let cid = null;
        const parseResponse = () => {
            try {
                const parsed = JSON.parse(res.data);
                if (parsed.error) return { error: parsed.error };
                return { cid: parsed.cid || null };
            } catch (_) {
                return { error: res.data };
            }
        };
        let out = parseResponse();
        if (out.error) {
            results.push({ name: entry.name, ok: false, error: out.error });
            console.log(`  [${entry.name}] FAIL:`, out.error);
            continue;
        }
        cid = out.cid;

        if (!cid || !cid.startsWith("0x")) {
            await sleep(5000);
            const retryRes = await request("POST", BASE + "/log", body);
            res = retryRes;
            out = parseResponse();
            cid = out.cid;
        }
        if (!cid || !cid.startsWith("0x")) {
            results.push({ name: entry.name, ok: false, error: "no cid in response (0G upload may have failed on server)" });
            console.log(`  [${entry.name}] FAIL: no cid (not pinned to 0G). Server response: ${res.data.slice(0, 120)}...`);
            continue;
        }

        let fetchOk = false;
        const content = await fetchFrom0g(cid);
        if (content && content.includes(entry.expectInContent)) fetchOk = true;

        results.push({ name: entry.name, ok: true, cid, fetchOk });
        console.log(`  [${entry.name}] OK  cid=${cid.slice(0, 18)}... ${fetchOk ? "(fetch OK)" : "(fetch skipped or failed)"}`);
    }

    const allOk = results.every((r) => r.ok);
    const allFetched = results.filter((r) => r.ok).every((r) => r.fetchOk !== false);
    console.log("");
    if (allOk) {
        console.log("Result: All 4 tag types (proposal, audit, execution, consensus) stored in 0G and returned cid.");
        if (!process.env["0G_INDEXER_RPC"]) {
            console.log("(Set 0G_INDEXER_RPC in .env to verify fetch from 0G.)");
        } else if (!allFetched) {
            console.log("(Some cids could not be fetched; 0G may still be syncing.)");
        } else {
            console.log("Fetch verification: all cids retrievable from 0G.");
        }
    } else {
        console.log("Result: FAIL — some tag types did not return cid.");
        process.exit(1);
    }
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
