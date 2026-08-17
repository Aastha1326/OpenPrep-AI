const express = require('express');
const router = express.Router();
const crdtMiddleware = require('../middleware/crdtMiddleware');

// Mock a note resource endpoint that handles sync conflicts
router.post('/sync/notes', crdtMiddleware, (req, res) => {
  // If the request made it past the middleware, it was merged/accepted
  res.status(200).json({ 
    message: 'Sync successful', 
    mergedData: req.body // MVP returns what was sent
  });
});

module.exports = router;
