const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'Candidate' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  filePath: { type: String, default: '' },
  originalName: { type: String, default: '' },
  resumeText: { type: String, default: '' },
  detectedSkills: { type: [String], default: [] },
  missingSkills: { type: [String], default: [] },
  bonusSkills: { type: [String], default: [] },
  matchScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Candidate', CandidateSchema);
