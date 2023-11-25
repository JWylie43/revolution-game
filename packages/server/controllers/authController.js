const attemptLogin = require("./express/attemptLogin")
const attemptRegister = require("./express/attemptRegister")
const handleLogin = require("./express/handleLogin")
const { logoutDelete } = require("./express/logoutDelete")

module.exports = {
  attemptLogin,
  attemptRegister,
  handleLogin,
  logoutDelete
}
