const redisClient = require("../redis")
module.exports.rateLimiter = async (req, res, next) => {
  const ip = req.connection.remoteAddress
  const loginAttempts = (await redisClient.multi().incr(ip).expire(ip, 60).exec())[0][1]
  console.log("loginAttempts", loginAttempts)
  if (loginAttempts > 10) {
    res.json({ loggedIn: false, status: "Too many attempts. Try in one minute" })
    return
  }
  next()
}
