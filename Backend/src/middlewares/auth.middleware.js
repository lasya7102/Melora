const jwt = require("jsonwebtoken");

function getToken(req) {
    return req.cookies && req.cookies.token;
}

function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

async function authArtist(req, res, next) {
    const token = getToken(req);

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    try {
        const decoded = verifyToken(token);

        if (decoded.role !== "artist") {
            return res.status(403).json({
                message: "You don't have access"
            });
        }

        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

async function authAlbum(req, res, next) {
    const token = getToken(req);

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    try {
        const decoded = verifyToken(token);

        if (decoded.role !== "artist") {
            return res.status(403).json({
                message: "You don't have access"
            });
        }

        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

async function authUser(req, res, next) {
    const token = getToken(req);

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    try {
        const decoded = verifyToken(token);

        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

module.exports = {
    authArtist,
    authAlbum,
    authUser
};
