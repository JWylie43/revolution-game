const { formSchema } = require("@revolution-game/common")

const validateForm = async (req, res) => {
  try {
    const formData = req.body
    const valid = await formSchema.validate(formData)

    if (valid) {
      console.log("form is good")
    } else {
      // Handle the case where the form is not valid
      res.status(422).send()
    }
  } catch (err) {
    // Handle validation errors
    console.error(err.errors)
    res.status(500).send() // or handle the error in a way that makes sense for your application
  }
}

module.exports = validateForm
