import { Button, ButtonGroup, Heading, Text, VStack } from "@chakra-ui/react"
import { formSchema, ipaddress } from "@revolution-game/common"
import { Form, Formik } from "formik"
import { useState } from "react"
import { useAccountProvider } from "../../providers/AccountProvider"
import TextField from "../TextField"

export const Login = (props) => {
  const { setAction } = props
  const { setUser } = useAccountProvider()
  const [error, setError] = useState(null)
  return (
    <Formik
      initialValues={{ username: "", password: "" }}
      validationSchema={formSchema}
      onSubmit={async (values, actions) => {
        try {
          actions.resetForm()
          const loginResponse = await fetch(`http://${ipaddress}:4000/auth/login`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(values)
          })
          if (!loginResponse || !loginResponse.ok || loginResponse.status >= 400) {
            return
          }
          const data = await loginResponse.json()
          if (!data) return
          setUser({ ...data })
          if (data.status) {
            setError(data.status)
          }
        } catch (e) {
          console.error("login error", e)
        }
      }}
    >
      <VStack as={Form} w={{ base: "90%", md: "500px" }} m="auto" justify="center" h="100vh" spacing="1rem">
        <Heading>Log In</Heading>
        <Text as="p" color="red.500">
          {error}
        </Text>
        <TextField name="username" placeholder="Enter username" autoComplete="off" label="Username" />
        <TextField name="password" placeholder="Enter password" autoComplete="off" label="Password" type="password" />
        <ButtonGroup pt="1rem">
          <Button colorScheme="teal" type="submit">
            Log In
          </Button>
          <Button onClick={() => setAction("register")}>Create Account</Button>
        </ButtonGroup>
      </VStack>
    </Formik>
  )
}
