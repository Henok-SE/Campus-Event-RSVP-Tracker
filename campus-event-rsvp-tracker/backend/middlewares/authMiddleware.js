const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Access denied. No token provided" });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    try {
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : authHeader;

        const verified = jwt.verify(token, process.env.JWT_SECRET);

        req.user = verified;

        return next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }

};

module.exports = authMiddleware;