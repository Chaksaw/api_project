"use strict";

const jwt = require("jsonwebtoken");
const { jwtSecret, publicRoutes } = require("../config");

function authMiddleware(req, res, next) {
    // Allow public routes without auth
    if (publicRoutes.some((p) => req.path.startsWith(p))) return next();

    const header = req.headers["authorization"] || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing Bearer token" });
    try {
        const payload = jwt.verify(token, jwtSecret);
        req.user = payload;
        return next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

module.exports = authMiddleware;
