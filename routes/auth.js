import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

/**
 * 🔐 Middleware: Only Main Admin Can Proceed
 */
export const isMainAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Admins only' });
    }

    const currentUser = await User.findById(req.user.id);
    if (!currentUser?.isMainAdmin) {
      return res.status(403).json({ msg: 'Only Main Admin allowed' });
    }

    next();
  } catch (err) {
    console.error('[Middleware] isMainAdmin Error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

/**
 * 🧑‍🎓 Public: Student Registration
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: 'user',            // 🎓 Only student registration allowed here
      isMainAdmin: false,
    });

    await newUser.save();
    res.status(201).json({ message: 'Student registered successfully' });
  } catch (err) {
    console.error('[Route] Student Registration Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * 🔐 Public: Login (for all roles)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log(`[Login Attempt] ${email} as ${role}`);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('[Login Error] User not found');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role !== role) {
      console.log('[Login Error] Role mismatch:', user.role, role);
      return res.status(403).json({ message: 'Role mismatch! You selected wrong role.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('[Login Error] Incorrect password');
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        isMainAdmin: user.isMainAdmin || false,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('[Login Success]', user.email);
    res.json({
      token,
      role: user.role,
      isMainAdmin: user.isMainAdmin || false,
    });
  } catch (err) {
    console.error('[Route] Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * 👑 Protected: Create Admin (Main Admin Only)
 */
router.post('/create-admin', auth, isMainAdmin, async (req, res) => {
  try {
    const { name, email, password, isMainAdmin } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: 'admin',
      isMainAdmin: isMainAdmin || false,
    });

    await newUser.save();
    res.json({ message: 'Admin created successfully!' });
  } catch (err) {
    console.error('[Route] Create Admin Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * 🔁 Public: Reset Password (No Auth Yet)
 * TODO: Protect with OTP/token in future
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('[Route] Reset Password Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('[Route] Change Password Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
