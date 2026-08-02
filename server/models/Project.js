const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    requiredSkills: { type: [String], default: [] }, // Skills needed for this project
    interests: { type: [String], default: [] },       // Domain tags: AI, Web3, etc.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pendingRequests: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String, default: '' },
        aiSummary: { type: String, default: '' }
      }
    ],
    maxTeamSize: { type: Number, default: 5 },

    // GitHub Integration
    githubRepoUrl: { type: String },
    githubRepoName: { type: String },
    githubRepoOwner: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', ProjectSchema);