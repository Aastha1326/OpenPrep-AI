const express = require('express');
const router = express.Router();
const { getTree, createFolder, moveFolder } = require('../controllers/folderController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/tree', getTree);
router.post('/', createFolder);
router.patch('/:id/move', moveFolder);

module.exports = router;
