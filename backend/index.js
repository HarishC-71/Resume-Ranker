const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dns = require('dns');
require('dotenv').config();

// Ensure custom DNS servers for reliable MongoDB SRV lookup on Windows / ISP networks
if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch (dnsErr) {
    console.warn('Notice: Unable to set custom DNS servers, using system default:', dnsErr.message);
  }
}

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const apiRoutes = require('./routes/api');

const app = express();

// CORS configuration to allow deployed frontend and all origins
const corsOptions = {
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

// Root health-check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Resume-Ranker API is running!'
  });
});

// Routes
app.use('/api', apiRoutes);

// Global Error Handler for Multer and application errors
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'An unexpected error occurred' });
  }
  next();
});

const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resume-ranker';
  const fallbackUri = 'mongodb://127.0.0.1:27017/resume-ranker';

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('MongoDB connected successfully');
  } catch (primaryErr) {
    console.error('Primary MongoDB connection error:', primaryErr.message);

    // If primary was an Atlas SRV URI and failed, try local fallback
    if (primaryUri !== fallbackUri) {
      console.log('Attempting connection to local MongoDB fallback (127.0.0.1:27017)...');
      try {
        await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 4000
        });
        console.log('Connected to fallback local MongoDB successfully');
      } catch (fallbackErr) {
        console.error('Fallback local MongoDB also failed:', fallbackErr.message);
      }
    }
  }
};

connectDB();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };
