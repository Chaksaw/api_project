"use strict";

const { createClient } = require("redis");
const { redisUrl } = require("../config");

let redisClient;
let redisOk = false;

async function initRedis() {
    if (redisClient) return redisClient;
    try {
        redisClient = createClient({ url: redisUrl });
        redisClient.on("error", () => { });
        await redisClient.connect();
        redisOk = true;
        return redisClient;
    } catch (_e) {
        redisOk = false;
        return null;
    }
}

// Simple in-memory fallback store
const memStore = new Map();

function key(req) {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "unknown";
    const uid = req.user?.sub || "anon";
    return `${uid}:${ip}:${new Date().toISOString().slice(0, 13)}`; // bucket per hour
}

function rateLimit(opts = {}) {
    const windowSec = opts.windowSec || 60;
    const max = opts.max || 60;
    const prefix = opts.prefix || "rl";

    // init Redis eagerly but don't block startup
    initRedis();

    return async function rateLimitMiddleware(req, res, next) {
        const k = `${prefix}:${key(req)}`;
        try {
            if (redisOk && redisClient) {
                const tx = redisClient.multi();
                tx.incr(k);
                tx.expire(k, windowSec);
                const [count] = await tx.exec();
                const c = Array.isArray(count) ? count[1] : count; // node-redis returns number
                if (Number(c) > max) {
                    res.setHeader("Retry-After", windowSec.toString());
                    return res.status(429).json({ error: "Too Many Requests" });
                }
                return next();
            }
        } catch (_e) {
            // fall through to memory
        }

        // Memory fallback
        const now = Date.now();
        const entry = memStore.get(k) || { count: 0, reset: now + windowSec * 1000 };
        if (now > entry.reset) {
            entry.count = 0;
            entry.reset = now + windowSec * 1000;
        }
        entry.count += 1;
        memStore.set(k, entry);
        if (entry.count > max) {
            const retryAfter = Math.ceil((entry.reset - now) / 1000);
            res.setHeader("Retry-After", String(retryAfter));
            return res.status(429).json({ error: "Too Many Requests" });
        }
        return next();
    };
}

module.exports = { rateLimit, initRedis };
