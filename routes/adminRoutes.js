import express from 'express';
import bcrypt from 'bcryptjs';
import Admin from '../models/User.js';
import { auth, isMainAdmin } from '../middleware/auth.js';

const router = express.Router();

// ✅ GET all admins
router.get('/', auth, isMainAdmin, async (req, res) => {
  try {
    const admins = await Admin.find({role: { $in: ['admin', 'main'] }}, '-password');
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching admins' });
  }
});

// ✅ POST create sub-admin
router.post('/', auth, isMainAdmin, async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const count = await Admin.countDocuments({ role: 'main' });
    if (count >= 2 && req.user.role === 'main') {
      return res.status(400).json({ message: 'Only 2 main admins allowed' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
    });

    await newAdmin.save();
    res.status(201).json({ message: 'Sub-admin created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create admin' });
  }
});

// ✅ DELETE sub-admin
router.delete('/:id', auth, isMainAdmin, async (req, res) => {
  try {
    const targetAdmin = await Admin.findById(req.params.id);

    if (!targetAdmin) return res.status(404).json({ message: 'Admin not found' });
    if (targetAdmin.role === 'main') {
      return res.status(403).json({ message: 'Cannot delete main admin' });
    }

    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: 'Admin deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

// ✅ DIRECT EMAIL CHANGE (no OTP)
router.put('/update-email', auth, isMainAdmin, async (req, res) => {
  const { newEmail } = req.body;

  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin || !admin.isMainAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const exists = await Admin.findOne({ email: newEmail });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    admin.email = newEmail;
    await admin.save();

    res.json({ message: '✅ Email updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update email' });
  }
});

// ✅ DIRECT PASSWORD CHANGE
router.put('/update-password', auth, isMainAdmin, async (req, res) => {
  const { newPassword } = req.body;

  try {
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin || !admin.isMainAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;

    await admin.save();

    res.json({ message: '✅ Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update password' });
  }
});

export default router;
