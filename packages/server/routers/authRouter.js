const express = require("express")
const router = express.Router()
const Yup = require("yup")
const pool = require("../db")
const bcrypt = require("bcrypt")
const { v4: uuidv4 } = require("uuid")

const validateForm = (req, res, next) => {
  console.log("req", req)
  const formData = req.body
  Yup.object({
    username: Yup.string().required("Username required").min(6, "Username too short").max(28, "Username too long!"),
    password: Yup.string().required("Password required").min(6, "Password too short").max(28, "Password too long!")
  })
    .validate(formData)
    .catch(() => {
      res.status(422).send()
    })
    .then((valid) => {
      if (valid) {
        next()
      } else {
        res.status(422).send()
      }
    })
}
// const rateLimiter = (secondsLimit, limitAmount) => async (req, res, next) => {
//   const ip = req.connection.remoteAddress
//   ;[response] = await redisClient.multi().incr(ip).expire(ip, secondsLimit).exec()
//
//   if (response[1] > limitAmount)
//     res.json({
//       loggedIn: false,
//       status: "Slow down!! Try again in a minute."
//     })
//   else next()
// }
const attemptLogin = async (req, res) => {
  const potentialLogin = await pool.query("SELECT id, username, passhash, userid FROM users u WHERE u.username=$1", [
    req.body.username
  ])
  if (potentialLogin.rowCount > 0) {
    const isSamePass = await bcrypt.compare(req.body.password, potentialLogin.rows[0].passhash)
    if (isSamePass) {
      req.session.user = {
        username: req.body.username,
        id: potentialLogin.rows[0].id,
        userid: potentialLogin.rows[0].userid
      }
      res.json({ loggedIn: true, username: req.body.username })
    } else {
      res.json({ loggedIn: false, status: "Wrong username or password!" })
      console.log("not good")
    }
  } else {
    console.log("not good")
    res.json({ loggedIn: false, status: "Wrong username or password!" })
  }
}
const attemptRegister = async (req, res) => {
  const existingUser = await pool.query("SELECT username from users WHERE username=$1", [req.body.username])

  if (existingUser.rowCount === 0) {
    // register
    const hashedPass = await bcrypt.hash(req.body.password, 10)
    const newUserQuery = await pool.query(
      "INSERT INTO users(username, passhash, userid) values($1,$2,$3) RETURNING id, username, userid",
      [req.body.username, hashedPass, uuidv4()]
    )
    req.session.user = {
      username: req.body.username,
      id: newUserQuery.rows[0].id,
      userid: newUserQuery.rows[0].userid
    }
    res.json({ loggedIn: true, username: req.body.username })
  } else {
    res.json({ loggedIn: false, status: "Username taken" })
  }
}
// router.route("/login").get(handleLogin).post(validateForm, rateLimiter(60, 10), attemptLogin)
router.post("/login", validateForm, attemptLogin)
// router.post("/signup", validateForm, rateLimiter(30, 4), attemptRegister)
router.post("/signup", validateForm, attemptRegister)
// router.delete("/logout", rateLimiter(30, 4), logoutDelete)
// router.delete("/logout", logoutDelete)
module.exports = router
