const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/apiResponse");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return sendError(res, {
            status: 401,
            code: "UNAUTHORIZED",
            message: "Access denied. No token provided"
        });
    }

    if (!process.env.JWT_SECRET) {
        return sendError(res, {
            status: 500,
            code: "CONFIGURATION_ERROR",
            message: "JWT_SECRET is not configured"
        });
    }

    try {
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : authHeader;

        const verified = jwt.verify(token, process.env.JWT_SECRET);

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