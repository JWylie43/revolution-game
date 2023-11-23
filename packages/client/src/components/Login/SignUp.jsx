import { ArrowBackIcon } from "@chakra-ui/icons"
import { Button, ButtonGroup, Heading, Text, VStack } from "@chakra-ui/react"
import { formSchema } from "@revolution-game/common"
import { Form, Formik } from "formik"
import { useNavigate } from "react-router"
import TextField from "./TextField"
import { useAccountProvider } from "../AccountContext"
import { useState } from "react"

const SignUp = () => {
  const { setUser } = useAccountProvider()
  const [error, setError] = useState(null)

  const navigate = useNavigate()
  return (
    <Formik
      initialValues={{ username: "", password: "" }}
      validationSchema={formSchema}
      onSubmit={async (values, actions) => {
        actions.resetForm()
        const response = await fetch("http://localhost:4000/auth/register", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(values)
        })
        console.log("response", response)
        if (!response || !response.ok || response.status >= 400) {
          // Handle error condition if needed
          return
        }
        const data = await response.json()
        console.log("data", data)
        if (!data) {
          return
        }
        setUser(data)
        if (data.status) {
          setError(data.status)
          return
        }
        navigate("/home")
      }}
    >
      <VStack as={Form} w={{ base: "90%", md: "500px" }} m="auto" justify="center" h="100vh" spacing="1rem">
        <Heading>Sign Up</Heading>
        <Text color="red.500">{error}</Text>
        <TextField name="username" placeholder="Enter username" autoComplete="off" label="Username" />

        <TextField name="password" placeholder="Enter password" autoComplete="off" label="Password" type="password" />

        <ButtonGroup pt="1rem">
          <Button colorScheme="teal" type="submit">
            Create Account
          </Button>
          <Button onClick={() => navigate("/")} leftIcon={<ArrowBackIcon />}>
            Back
          </Button>
        </ButtonGroup>
      </VStack>
    </Formik>
  )
}

export default SignUp
