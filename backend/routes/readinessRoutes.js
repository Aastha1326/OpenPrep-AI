const express = require('express');
const { protect } = require('../middleware/auth');
const { getSubjectReadiness } = require('../controllers/readinessController');

const router = express.Router();

router.get('/', protect, getSubjectReadiness);

module.exports = router;
