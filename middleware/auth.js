import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ✅ Middleware to verify JWT token
export async function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ msg: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ msg: 'Invalid token: user not found' });

    req.user = user; // Attach full user object (not just decoded token)
    next();
  } catch (err) {
    console.error('❌ JWT Verification Error:', err);
    return res.status(401).json({ msg: 'Invalid or expired token' });
  }
}

// ✅ Middleware: Any admin (main or sub-admin)
export function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied: Admins only' });
  }
  next();
}

// ✅ Middleware: Main admin only
export function isMainAdmin(req, res, next) {
  if (req.user.role !== 'admin' || !req.user.isMainAdmin) {
    return res.status(403).json({ msg: 'Access denied: Main admin only' });
  }
  next();
}

// ✅ Middleware: Students only
export function isStudent(req, res, next) {
  if (req.user.role !== 'user') {
    return res.status(403).json({ msg: 'Access denied: Students only' });
  }
  next();
}
