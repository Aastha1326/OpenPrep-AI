const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// In a real application, you'd protect these routes with an auth middleware
// const authMiddleware = require('../middleware/auth');
// router.use(authMiddleware);

router.get('/vapid-key', notificationController.getVapidKey);
router.post('/subscribe', notificationController.subscribe);
router.put('/preferences', notificationController.updatePreferences);

module.exports = router;
