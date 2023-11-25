module.exports.logoutDelete = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ loggedOut: false, status: "Error during logout" })
    }
    res.clearCookie("sid") // Clear the session cookie
    res.json({ loggedOut: true })
  })
}
