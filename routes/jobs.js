import express from 'express';
import Job from '../models/Job.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// GET all jobs
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    console.error('❌ Error fetching jobs:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST new job
router.post('/jobs', auth, async (req, res) => {
  try {
    const {
      title,
      company,
      description,
      location,
      salary,
      experience,
      employmentType,
      department,
      education,
      skills,
      openings
    } = req.body;

    if (!title || !company || !description || !location) {
      return res.status(400).json({ msg: 'Please fill all required fields' });
    }

    const newJob = new Job({
      title,
      company,
      description,
      location,
      salary,
      experience,
      employmentType,
      department,
      education,
      skills,
      openings
    });

    await newJob.save();
    res.status(201).json(newJob);
  } catch (err) {
    console.error('❌ Error posting job:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT update job
router.put('/jobs/:id', auth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const updatedJob = await Job.findByIdAndUpdate(jobId, req.body, { new: true });

    if (!updatedJob) return res.status(404).json({ msg: 'Job not found' });

    res.json(updatedJob);
  } catch (err) {
    console.error('❌ Error updating job:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE job
router.delete('/jobs/:id', auth, async (req, res) => {
  console.log("🔍 DELETE request received for job ID:", req.params.id);
  try {
    const jobId = req.params.id;
    const deletedJob = await Job.findByIdAndDelete(jobId);
    if (!deletedJob) return res.status(404).json({ msg: 'Job not found' });

    res.json({ msg: 'Job deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting job:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
