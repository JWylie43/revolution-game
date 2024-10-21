import { Button, ButtonGroup, Heading, VStack } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useNavigate } from "react-router"
import * as Yup from "yup"
import TextField from "./TextField"
import { useAccountProvider } from "../providers/AccountProvider.jsx"
import { useState } from "react"
import { ArrowBackIcon } from "@chakra-ui/icons"

export const Login = () => {
  const navigate = useNavigate()
  const { accountInfo, setAccountInfo, login } = useAccountProvider()
  const [register, setRegister] = useState(false)
  return (
    <Formik
      initialValues={{ username: "", password: "" }}
      validationSchema={Yup.object({
        username: Yup.string().required("Username required!").min(6, "Username too short!").max(28, "Username too long!"),
        password: Yup.string().required("Password required!").min(6, "Password too short!").max(28, "Password too long!")
      })}
      onSubmit={async (values, actions) => {
        actions.resetForm()
        await login({ ...values, register })
      }}
    >
      <VStack as={Form} w={{ base: "90%", md: "500px" }} m="auto" justify="center" h="100vh" spacing="1rem">
        <Heading>{register ? "Sign Up" : "Log In"}</Heading>
        <TextField name="username" placeholder="Enter username" autoComplete="off" label="Username" />

        <TextField name="password" placeholder="Enter password" autoComplete="off" label="Password" type="password" />

        <ButtonGroup pt="1rem">
          <Button colorScheme="teal" type="submit">
            {register ? "Create Account" : "Log In"}
          </Button>
          {register ? (
            <Button onClick={() => setRegister(false)} leftIcon={<ArrowBackIcon />}>
              Back
            </Button>
          ) : (
            <Button onClick={() => setRegister(true)}>Create Account</Button>
          )}
        </ButtonGroup>
      </VStack>
    </Formik>
  )
}
