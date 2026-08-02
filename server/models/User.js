const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },

    // Matching fields
    skills: { type: [String], default: [] },       // e.g. ['React', 'Node.js', 'ML']
    interests: { type: [String], default: [] },    // e.g. ['AI', 'Web3', 'Healthcare']
    role: { type: String, default: 'Full Stack' }, // Frontend | Backend | Designer | ML Engineer

    // GitHub Integration
    githubId: { type: String },
    githubAccessToken: { type: String },
    githubUsername: { type: String },

    // Profile
    bio: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
