const express = require('express');
const { query } = require('../db-pg');

const router = express.Router();

// Public endpoint — returns active boards in display order
router.get('/', async (req, res) => {
  try {
    const boards = (await query(
      'SELECT * FROM board_config WHERE is_active = 1 ORDER BY display_order ASC',
      []
    )).rows;
    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
