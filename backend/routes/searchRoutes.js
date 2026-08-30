const express = require('express');
const { globalSearch, semanticSearch } = require('../controllers/searchController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, globalSearch);
router.get('/semantic', protect, semanticSearch);

module.exports = router;
