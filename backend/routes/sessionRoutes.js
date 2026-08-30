const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');

// Optional protect middleware so unauthenticated fallbacks during session expiry can still pass if needed
const optionalProtect = (req, res, next) => {
  if (req.headers.authorization || req.cookies?.token) {
    return protect(req, res, next);
  }
  next();
};

// POST /session/save or /api/session/save
router.post('/save', optionalProtect, sessionController.saveSession);

// GET /session/saved or /api/session/saved
router.get('/saved', optionalProtect, sessionController.getSavedSession);

// POST /session/restore or /api/session/restore
router.post('/restore', optionalProtect, sessionController.restoreSession);

// DELETE /session/saved or /api/session/saved
router.delete('/saved', optionalProtect, (req, res) => {
  req.body = { ...req.body, action: 'discard' };
  return sessionController.restoreSession(req, res);
});

module.exports = router;
