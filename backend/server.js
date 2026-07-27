require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/error');
const { protect } = require('./middleware/auth');
const fs = require('fs');
const PYQ = require('./models/PYQ');
const Note = require('./models/Note');

// Validate required environment variables at startup
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  console.error('Set JWT_SECRET in your .env file or environment before starting the server.');
  process.exit(1);
}

// Import routes
const authRoutes = require('./routes/authRoutes');
const academicRoutes = require('./routes/academicRoutes');
const pyqRoutes = require('./routes/pyqRoutes');
const studyPlanRoutes = require('./routes/studyPlanRoutes');
const quizRoutes = require('./routes/quizRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const noteRoutes = require('./routes/noteRoutes');
const progressRoutes = require('./routes/progressRoutes');
const communityRoutes = require('./routes/communityRoutes');

// Connect to Database
connectDB();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// CSRF protection middleware
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Cookie parser (required for csurf cookie-based tokens)
app.use(cookieParser());

// Response compression (skip binary uploads via default filter)
app.use(compression());

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// General API rate limiter: 100 requests per 15 minutes per IP
// Auth routes have tighter per-route limits defined in authRoutes.js
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Protected Route for File Uploads (replaces insecure express.static)
app.get('/uploads/:filename', protect, async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const fileUrl = `/uploads/${filename}`;
    
    // Verify file ownership or public access
    const pyq = await PYQ.findOne({ where: { fileUrl, user: req.user.id } });
    const note = await Note.findOne({ where: { fileUrl } });
    
    const hasNoteAccess = note && (note.user === req.user.id || note.isPublic);
    
    if (!pyq && !hasNoteAccess) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not have permission to view this file.' });
    }
    
    const filePath = path.join(__dirname, 'uploads', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found on server.' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/pyqs', pyqRoutes);
app.use('/api/study-plans', studyPlanRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/community', communityRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to OpenPrep AI Backend REST API API Services' });
});

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
