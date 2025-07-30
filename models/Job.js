import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  experience: { type: String, default: '0 - 1 years' },
  salary: { type: String, default: 'Not Disclosed' },
  employmentType: { type: String, default: 'Full Time' }, // Full Time / Part Time / Internship
  department: { type: String, default: 'IT Services & Consulting' },
  education: { type: String, default: 'UG: B.Tech/B.E. in Computers' },
  skills: [{ type: String }], // e.g., ["React.js", "Node.js", "CSS"]
  openings: { type: Number, default: 1 },
  applicantsCount: { type: Number, default: 0 },
  postedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Job', jobSchema);
