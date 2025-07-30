import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['admin','user'], default: 'user' },
  isMainAdmin: { type: Boolean, default: false },
});

// ✅ default export
const User = mongoose.model('User', userSchema);
export default User;
