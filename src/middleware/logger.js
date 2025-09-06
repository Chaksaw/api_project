"use strict";

const { randomUUID } = require("crypto");

function requestId(req, _res, next) {
    req.id = req.headers["x-request-id"] || randomUUID();
    next();
}

function logger(req, res, next) {
    const start = Date.now();
    res.on("finish", () => {
        const ms = Date.now() - start;
        // tiny log format
        console.log(`${req.id} ${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
    });
    next();
}

module.exports = { requestId, logger };
