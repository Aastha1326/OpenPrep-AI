const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('../../routes/authRoutes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

// Generic error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  res.status(status).json({ success: false, error: err.message || 'Server Error' });
});

module.exports = app;
