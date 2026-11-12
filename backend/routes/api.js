const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const JD = require('../models/JD');
const { parseResume, extractNameAndContact } = require('../utils/parser');
const { extractSkills, extractJDSkills, calculateMatchScore, getMissingSkills, getBonusSkills } = require('../utils/nlp');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Database readiness check middleware
const checkDB = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database is connecting or offline. Please verify MongoDB connection or network access.'
    });
  }
  next();
};

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.pdf', '.docx', '.doc'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOCX, and DOC files are supported'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit per file
});

// GET /api/health
router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// POST /job-description (Replace active JD)
router.post('/job-description', checkDB, async (req, res) => {
  try {
    const { text, title } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Job description text is required' });
    }

    // Replace all existing JDs with the new one
    await JD.deleteMany({});

    // Also clear existing candidates when new JD is uploaded so cleanslate
    await Candidate.deleteMany({});

    const extractedSkills = extractJDSkills(text);

    const jd = new JD({
      title: title || 'New Job Description',
      text: text.trim(),
      extractedSkills
    });

    await jd.save();

    res.status(200).json({ message: 'Job description saved successfully', jd });
  } catch (error) {
    console.error('Error saving Job Description:', error);
    res.status(500).json({ error: 'Server error saving Job Description', details: error.message });
  }
});

// POST /upload-resume
router.post('/upload-resume', checkDB, upload.array('resumes', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const activeJD = await JD.findOne().sort({ createdAt: -1 });
    if (!activeJD) {
      return res.status(400).json({ error: 'Please submit a job description first before uploading resumes.' });
    }

    const results = [];

    for (const file of req.files) {
      const text = await parseResume(file.path, file.mimetype);
      const contactInfo = extractNameAndContact(text);

      const resumeSkills = extractSkills(text, activeJD.extractedSkills);
      const missingSkills = getMissingSkills(resumeSkills, activeJD.extractedSkills);
      const bonusSkills = getBonusSkills(resumeSkills, activeJD.extractedSkills);

      const matchScore = calculateMatchScore(text, activeJD.text, resumeSkills, activeJD.extractedSkills);

      const parsedFilename = path.parse(file.originalname).name.replace(/[-_]/g, ' ');
      const candidateName = (contactInfo.name && contactInfo.name !== 'Unknown Candidate')
        ? contactInfo.name
        : parsedFilename;

      const candidate = new Candidate({
        name: candidateName,
        email: contactInfo.email || '',
        phone: contactInfo.phone || '',
        filePath: 'uploads/' + path.basename(file.path),
        originalName: file.originalname,
        resumeText: text ? (text.substring(0, 1000) + (text.length > 1000 ? '...' : '')) : 'No text extracted',
        detectedSkills: resumeSkills,
        missingSkills: missingSkills,
        bonusSkills: bonusSkills,
        matchScore: matchScore
      });

      await candidate.save();
      results.push(candidate);
    }

    res.status(200).json({ message: 'Resumes processed successfully', candidates: results });
  } catch (error) {
    console.error('Error processing resumes:', error);
    res.status(500).json({ error: 'Server error processing resumes', details: error.message });
  }
});

// GET /rank-candidates
router.get('/rank-candidates', checkDB, async (req, res) => {
  try {
    const minScore = parseInt(req.query.minScore) || 0;

    const candidates = await Candidate.find({ matchScore: { $gte: minScore } }).sort({ matchScore: -1 });
    const activeJD = await JD.findOne().sort({ createdAt: -1 });

    res.status(200).json({ jd: activeJD, candidates });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Server error fetching candidates', details: error.message });
  }
});

// DELETE /candidates (Utility to clear candidates)
router.delete('/candidates', checkDB, async (req, res) => {
  try {
    await Candidate.deleteMany({});
    res.status(200).json({ message: 'Candidates cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error clearing candidates', details: error.message });
  }
});

// DELETE /job-description (Clear active JD and candidates)
router.delete('/job-description', checkDB, async (req, res) => {
  try {
    await JD.deleteMany({});
    await Candidate.deleteMany({});
    res.status(200).json({ message: 'Job description and candidates cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error clearing job description', details: error.message });
  }
});

module.exports = router;
