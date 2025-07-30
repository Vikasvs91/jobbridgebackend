import Admin from '../models/User.js';

/**
 * ✅ Direct email change (no OTP required)
 */
export const changeEmailDirectly = async (req, res) => {
  const { newEmail } = req.body;

  try {
    if (!newEmail) {
      return res.status(400).json({ message: 'New email is required' });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const existing = await Admin.findOne({ email: newEmail });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    admin.email = newEmail;
    await admin.save();

    res.json({ message: '✅ Email updated successfully' });
  } catch (err) {
    console.error('Email Change Error:', err);
    res.status(500).json({ message: 'Failed to update email' });
  }
};
