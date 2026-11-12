const mongoose = require('mongoose');

const JDSchema = new mongoose.Schema({
  title: { type: String, default: 'Default JD' },
  text: { type: String, required: true },
  extractedSkills: { type: [String] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JD', JDSchema);
