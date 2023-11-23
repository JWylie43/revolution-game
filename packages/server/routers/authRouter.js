const express = require("express")
const validateForm = require("../controllers/validateForm")
const router = express.Router()
const pool = require("../db")
const bcrypt = require("bcrypt")

router
  .route("/login")
  .get(async (req, res) => {
    if (req.session.user && req.session.user.username) {
      res.json({ loggedIn: true, username: req.session.user.username })
    } else {
      res.json({ loggedIn: false })
    }
  })
  .post(async (req, res) => {
    await validateForm(req, res)
    console.log("session", req.session)
    const { username, password } = req.body
    const queryResponse = (await pool.query(`SELECT id, username,passhash FROM users WHERE users.username = '${username}';`))
      .rows[0]
    if (!queryResponse) {
      res.json({ loggedIn: false, status: "Wrong username or password!" })
      return
    }
    const matchingPassword = await bcrypt.compare(password, queryResponse.passhash)
    if (matchingPassword) {
      req.session.user = {
        username,
        id: queryResponse.id
      }
      res.json({ loggedIn: true, username })
      return
    }
    res.json({ loggedIn: false, status: "Wrong username or password!" })
  })

router.post("/register", async (req, res) => {
  await validateForm(req, res)
  const { username, password } = req.body
  const existingUser = (await pool.query(`SELECT username FROM users WHERE username='${username}';`)).rows.length > 0
  if (existingUser) {
    res.json({ loggedIn: false, status: "Username Taken" })
    return
  }
  const hashedPass = await bcrypt.hash(password, 10)
  const newUserQuery = await pool.query(
    `INSERT INTO users (username,passhash) values ('${username}','${hashedPass}') RETURNING id,username;`
  )
  req.session.user = { username, id: newUserQuery.rows[0].id }
  res.json({ loggedIn: true, username })
})
module.exports = router
