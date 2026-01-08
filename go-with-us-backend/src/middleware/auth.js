import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify JWT token middleware
export const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { userId, email, role }
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
};

// Verify JWT token optionally (don't throw error if no token)
export const verifyTokenOptional = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        }
        next();
    } catch (error) {
        // If token is invalid, just proceed without user
        next();
    }
};
