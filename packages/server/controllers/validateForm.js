const { formSchema } = require("@revolution-game/common")

const validateForm = async (req, res, next) => {
  try {
    const formData = req.body
    const valid = await formSchema.validate(formData)
    if (valid) {
      console.log("form is good")
      next()
    } else {
      res.status(422).send()
    }
  } catch (err) {
    res.status(422).send()
  }
}

module.exports = validateForm
