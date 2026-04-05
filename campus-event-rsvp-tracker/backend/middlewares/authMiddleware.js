const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/apiResponse");
const { getConfig } = require("../config/env");

const { jwtSecret } = getConfig();

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
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : authHeader;

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

module.exports = authMiddleware;