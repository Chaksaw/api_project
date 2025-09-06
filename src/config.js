"use strict";

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET || "dev_secret_change_me";
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const publicRoutes = (process.env.PUBLIC_ROUTES || "/health")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const routesFile = process.env.ROUTES_FILE || path.join(__dirname, "..", "config", "routes.json");

function loadRoutes() {
    try {
        const raw = fs.readFileSync(routesFile, "utf8");
        const json = JSON.parse(raw);
        if (!json.routes || !Array.isArray(json.routes)) throw new Error("Invalid routes.json: missing routes array");
        return json.routes;
    } catch (err) {
        console.warn(`Failed to load routes from ${routesFile}: ${err.message}. Using defaults.`);
        return [
            { path: "/users", target: "http://localhost:4001" },
            { path: "/orders", target: "http://localhost:4002" },
        ];
    }
}

module.exports = { port, jwtSecret, redisUrl, publicRoutes, routesFile, loadRoutes };
