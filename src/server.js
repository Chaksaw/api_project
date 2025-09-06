"use strict";

const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const { port } = require("./config");
const auth = require("./middleware/auth");
const { rateLimit } = require("./middleware/rateLimit");
const { requestId, logger } = require("./middleware/logger");
const { buildRouter } = require("./routes");

const app = express();

// Base middleware
app.disable("x-powered-by");
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(requestId);
app.use(logger);
app.use(morgan("tiny"));

// Rate limit fairly early
app.use(rateLimit({ windowSec: 60, max: 90 }));

// Auth after public routes are whitelisted by middleware itself
app.use(auth);

// Mount dynamic proxy routes
app.use(buildRouter());

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error("Unhandled error", err);
    res.status(500).json({ error: "Internal Server Error" });
});

if (require.main === module) {
    app.listen(port, () => console.log(`API Gateway listening on :${port}`));
}

module.exports = app;
