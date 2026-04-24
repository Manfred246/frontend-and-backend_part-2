const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'practice19_db',
  password: '1333',
  port: 5432,
});

module.exports = pool;