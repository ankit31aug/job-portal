const express = require('express');
const db = require('../db');
const router = express.Router();

// Public endpoint — returns active boards in display order
router.get('/', (req, res) => {
  const boards = db.prepare('SELECT * FROM board_config WHERE is_active = 1 ORDER BY display_order ASC').all();
  res.json(boards);
});

module.exports = router;
