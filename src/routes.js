"use strict";

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { loadRoutes, routesFile } = require("./config");

function buildRouter() {
    const router = express.Router();

    // Healthcheck and diagnostics
    router.get("/health", (_req, res) => res.json({ status: "ok" }));
    router.get("/routes", (_req, res) => res.json({ source: routesFile, routes: loadRoutes() }));

    // Dynamic proxy routes
    const mappings = loadRoutes();
    for (const r of mappings) {
        const opts = {
            target: r.target,
            changeOrigin: true,
            pathRewrite: r.pathRewrite || {},
            logLevel: "warn",
            onProxyReq: (proxyReq, req) => {
                proxyReq.setHeader("x-request-id", req.id || "");
                if (req.user) {
                    proxyReq.setHeader("x-user-id", req.user.sub || "");
                }
            },
        };
        router.use(r.path, createProxyMiddleware(opts));
    }

    return router;
}

module.exports = { buildRouter };
