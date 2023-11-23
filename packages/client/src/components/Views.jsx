import { Route, Routes } from "react-router-dom"
import Login from "./Login/Login"
import SignUp from "./Login/SignUp"
import { Text } from "@chakra-ui/react"
import { PrivateRoutes } from "./PrivateRoutes"
import { useAccountProvider } from "./AccountContext"
const Views = () => {
  const { user } = useAccountProvider()
  console.log("user", user)
  return user.loggedIn === null ? (
    <Text>...Loading</Text>
  ) : (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<SignUp />} />
      <Route element={<PrivateRoutes />}>
        <Route path="/home" element={<Text>Welcome Home</Text>} />
      </Route>
      <Route path="*" element={<Login />} />
    </Routes>
  )
}

export default Views
