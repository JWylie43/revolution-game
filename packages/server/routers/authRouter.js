const express = require("express")
const validateForm = require("../controllers/validateForm")
const { rateLimiter } = require("../controllers/rateLimiter")
const router = express.Router()

const { handleLoginGet, handleLoginPost, handleRegisterPost } = require("../controllers/authController")
router.route("/login").get(handleLoginGet).post(validateForm, rateLimiter, handleLoginPost)
router.post("/register", validateForm, rateLimiter, handleRegisterPost)
module.exports = router
