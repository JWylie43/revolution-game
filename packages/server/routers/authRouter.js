const express = require("express")
const router = express.Router()
const Yup = require("yup")
const pool = require("../db")
const bcrypt = require("bcrypt")
const { v4: uuidv4 } = require("uuid")
const redisClient = require("../redis")

const validateForm = (req, res, next) => {
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
        console.log("valid", valid)
        next()
      } else {
        res.status(422).send()
      }
    })
}
const rateLimiter = (secondsLimit, limitAmount) => async (req, res, next) => {
  const ip = req.connection.remoteAddress
  const [response] = await redisClient.multi().incr(ip).expire(ip, secondsLimit).exec()
  if (response[1] > limitAmount)
    res.json({
      loggedIn: false,
      status: "Slow down!! Try again in a minute."
    })
  else next()
}
const handleLogin = (req, res) => {
  if (req.session.user && req.session.user.username) {
    res.json({ loggedIn: true, ...req.session.user })
  } else {
    res.json({ loggedIn: false })
  }
}
const attemptLogin = async (req, res) => {
  const { username, password } = req.body
  const existingUser = await pool.query("SELECT * FROM users WHERE username=$1", [username])
  if (existingUser.rows.length) {
    const userInfo = existingUser.rows[0]
    const passwordsMatch = await bcrypt.compare(password, userInfo.passhash)
    if (passwordsMatch) {
      req.session.user = {
        username,
        userId: userInfo.userid
      }
      res.json({ loggedIn: true, ...req.session.user })
    } else {
      res.json({ loggedIn: false, status: "Wrong username or password!" })
    }
  } else {
    res.json({ loggedIn: false, status: "Wrong username or password!" })
  }
}
const attemptRegister = async (req, res) => {
  const { username, password } = req.body
  const existingUser = await pool.query("SELECT username from users WHERE username=$1", [username])
  if (!existingUser.rows.length) {
    const hashedPass = await bcrypt.hash(password, 10)
    const newUser = await pool.query(
      "INSERT INTO users(username, passhash, userid) values($1,$2,$3) RETURNING id, username, userid",
      [username, hashedPass, uuidv4()]
    )
    req.session.user = {
      username,
      userId: newUser.rows[0].userid
    }
    res.json({ loggedIn: true, ...req.session.user })
  } else {
    console.log("Username Taken")
    res.json({ loggedIn: false, status: "Username taken" })
  }
}
const handleLogout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ loggedOut: false, status: "Error during logout" })
    }
    res.clearCookie("sid")
    res.json({ loggedOut: true })
  })
}
router.route("/login").get(handleLogin).post(validateForm, rateLimiter(60, 10), attemptLogin)
router.post("/register", validateForm, attemptRegister)
router.delete("/logout", handleLogout)
module.exports = router
