const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306, // CHANGED: was missing — silently used default port 3306 before,
                                      // which works for local MySQL but breaks any host (like Railway)
                                      // that needs a non-default external port (e.g. 19712)
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool.promise();