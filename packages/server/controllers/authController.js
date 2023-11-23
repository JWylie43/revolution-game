const pool = require("../db")
const bcrypt = require("bcrypt")

module.exports.handleLoginGet = (req, res) => {
  if (req.session.user && req.session.user.username) {
    res.json({ loggedIn: true, username: req.session.user.username })
  } else {
    res.json({ loggedIn: false })
  }
}

module.exports.handleLoginPost = async (req, res) => {
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
}

module.exports.handleRegisterPost = async (req, res) => {
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
}
