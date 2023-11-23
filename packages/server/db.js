const Pool = require("pg").Pool
require("dotenv").config()

const pool = new Pool({
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: "revolutiongame"
})

module.exports = pool
