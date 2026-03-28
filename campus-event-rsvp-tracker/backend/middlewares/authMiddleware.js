const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).json({message:"Access denied. No token provided"});
    }

    try{
        const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

        const verified = jwt.verify(token, "secretkey");

        req.user = verified;

        next();

    }catch(error){

       return res.status(400).json({message:"Invalid token"});

    }

};

module.exports = authMiddleware;