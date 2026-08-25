const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const controller = require('../controllers/communityResourceController');

router.get('/discover', protect, controller.discoverResources);
router.get('/trending', protect, controller.getTrending);
router.get('/stats', protect, controller.getCommunityStats);
router.get('/:resourceType/:resourceId', protect, controller.getResourceDetail);
router.get('/:resourceType/:resourceId/ratings', protect, controller.getResourceRatings);
router.post('/rate', protect, controller.rateResource);

module.exports = router;
