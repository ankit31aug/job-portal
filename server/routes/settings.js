const express = require('express');
const db = require('../db');
const { authenticate, requireHR } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  res.json(settings);
});

router.put('/', authenticate, requireHR, (req, res) => {
  const updates = req.body;
  const update = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
  for (const [key, value] of Object.entries(updates)) {
    update.run(String(value), key);
  }
  res.json({ message: 'Settings saved successfully' });
});

module.exports = router;
