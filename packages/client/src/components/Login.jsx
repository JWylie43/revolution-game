import { Button, ButtonGroup, Heading, VStack } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useNavigate } from "react-router"
import * as Yup from "yup"
import TextField from "./TextField"

const Login = () => {
  const navigate = useNavigate()
  return (
    <Formik
      initialValues={{ username: "", password: "" }}
      validationSchema={Yup.object({
        username: Yup.string().required("Username required!").min(6, "Username too short!").max(28, "Username too long!"),
        password: Yup.string().required("Password required!").min(6, "Password too short!").max(28, "Password too long!")
      })}
      onSubmit={(values, actions) => {
        actions.resetForm()
        fetch("http://localhost:4000/auth/login", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ ...values })
        })
          .catch((error) => {
            console.error("error", error)
            return
          })
          .then((response) => {
            if (!response || !response.ok || response.status >= 400) {
              console.error("response", response)
              return
            }
            return response.json()
          })
          .then((data) => {
            if (!data) {
              return
            }
            console.log("data", data)
            navigate("/home")
          })
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
