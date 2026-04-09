const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/apiResponse");
const { getConfig } = require("../config/env");

const { jwtSecret } = getConfig();

const extractToken = (authHeader = "") => {
    if (!authHeader || typeof authHeader !== "string") {
        return null;
    }

    return authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;
};

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return sendError(res, {
            status: 401,
            code: "UNAUTHORIZED",
            message: "Access denied. No token provided"
        });
    }

    try {
        const token = extractToken(authHeader);

        const verified = jwt.verify(token, jwtSecret);

        req.user = verified;

        return next();
    } catch (error) {
        return sendError(res, {
            status: 401,
            code: "INVALID_TOKEN",
            message: "Invalid token"
        });
    }

};

const optionalAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next();
    }

    try {
        const token = extractToken(authHeader);
        if (!token) {
            return next();
        }

        req.user = jwt.verify(token, jwtSecret);
        return next();
    } catch (error) {
        return sendError(res, {
            status: 401,
            code: "INVALID_TOKEN",
            message: "Invalid token"
        });
    }
};

const requireRole = (...allowedRoles) => (req, res, next) => {
    if (!req.user || !req.user.role) {
        return sendError(res, {
            status: 401,
            code: "UNAUTHORIZED",
            message: "Unauthorized"
        });
    }

    if (!allowedRoles.includes(req.user.role)) {
        return sendError(res, {
            status: 403,
            code: "FORBIDDEN",
            message: "Insufficient permissions"
        });
    }

    return next();
};

module.exports = authMiddleware;
module.exports.optionalAuthMiddleware = optionalAuthMiddleware;
module.exports.requireRole = requireRole;