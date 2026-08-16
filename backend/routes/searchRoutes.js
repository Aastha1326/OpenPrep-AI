const express = require('express');
const { globalSearch } = require('../controllers/searchController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, globalSearch);

module.exports = router;
