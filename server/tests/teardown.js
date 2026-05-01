const { pool } = require('../db-pg');

module.exports = async () => {
  await pool.end();
};
