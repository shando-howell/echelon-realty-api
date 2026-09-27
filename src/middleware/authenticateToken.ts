import jwt from "jsonwebtoken";

// @ts-expect-error (implicit any type)
const authenticateToken = (req, res, next) => {
    // Try to grab the token from the cookie first
    // If it's not there, try the Authorization header
    let token = req.cookies.token

    console.log("COOKIE => ", token);

    if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(' ')[1];
        console.log("AUTH HEADER TOKEN => ", token);
    }

    // If we still have no token, block access 
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    // @ts-expect-error (implicit any type)
    jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
        if (err) {
            console.log("Error in JWT verification ==> ", err);
            return res.status(403).json({ message: 'Invalid Token' });
        }
        console.log("Verified JWT ==> ", token);
        req.user = user;
        console.log("Verified User ==> ", user);
        next();
    });
};

export default authenticateToken;
