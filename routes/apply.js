import express from 'express';
import { auth, isAdmin, isStudent } from '../middleware/auth.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Application from '../models/Application.js';

const router = express.Router();

// Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});
const upload = multer({ storage });

/**
 * ✅ GET all applications (admin only)
 */
router.get('/applications', auth, isAdmin, async (req, res) => {
  try {
    const apps = await Application.find()
      .populate('jobId', 'title') // include job title
      .sort({ createdAt: -1 });

    res.status(200).json(apps);
  } catch (err) {
    console.error('❌ Applications List Error:', err);
    res.status(500).json({ message: 'Internal Server Error: ' + err.message });
  }
});

/**
 * ✅ Apply to a job (student only)
 */
router.post('/apply', auth, isStudent, upload.single('resume'), async (req, res) => {
  try {
    console.log('✅ Apply route hit!');
    console.log('👉 REQ USER:', req.user);
    console.log('👉 REQ BODY:', req.body);
    console.log('👉 REQ FILE:', req.file);

    const { jobId, name, email, phone } = req.body;
    if (!jobId || !name || !email || !phone) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Resume file is required.' });
    }

    const application = await Application.create({
      studentId: req.user.id,
      jobId,
      name,
      email,
      phone,
      resumeUrl: `uploads/${req.file.filename}`,
    });

    console.log('✅ Application Saved:', application._id);
    res.status(200).json({
      message: 'Application submitted successfully!',
      applicationId: application._id,
    });
  } catch (err) {
    console.error('❌ Apply Route Error:', err);
    res.status(500).json({ message: 'Internal Server Error: ' + err.message });
  }
});

export default router;
