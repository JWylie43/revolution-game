import { Button, ButtonGroup, Heading, VStack } from "@chakra-ui/react"
import { formSchema } from "@revolution-game/common"
import { Form, Formik } from "formik"
import { useNavigate } from "react-router"
import TextField from "./TextField"
import { useAccountProvider } from "../AccountContext"

const Login = () => {
  const { setUser } = useAccountProvider()
  const navigate = useNavigate()
  return (
    <Formik
      initialValues={{ username: "", password: "" }}
      validationSchema={formSchema}
      onSubmit={async (values, actions) => {
        actions.resetForm()
        const response = await fetch("http://localhost:4000/auth/login", {
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
        if (!data) return
        setUser(data)
        navigate("/home")
      }}
    >
      <VStack as={Form} w={{ base: "90%", md: "500px" }} m="auto" justify="center" h="100vh" spacing="1rem">
        <Heading>Log In</Heading>
        <TextField name="username" placeholder="Enter username" autoComplete="off" label="Username" />

        <TextField name="password" placeholder="Enter password" autoComplete="off" label="Password" type="password" />

        <ButtonGroup pt="1rem">
          <Button colorScheme="teal" type="submit">
            Log In
          </Button>
          <Button onClick={() => navigate("/register")}>Create Account</Button>
        </ButtonGroup>
      </VStack>
    </Formik>
  )
}

export default Login
