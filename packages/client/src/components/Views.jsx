import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import { Home } from "./Home/Home"
import { GameRouter } from "./Home/GameRouter"
import { Login } from "./Login/Login"
import { SignUp } from "./Login/SignUp"
import { useAccountProvider } from "../providers/AccountProvider"

const PrivateRoutes = () => {
  const { user } = useAccountProvider()
  return user && user.loggedIn ? <Outlet /> : <Navigate to="/" />
}

export const Views = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<SignUp />} />
      <Route element={<PrivateRoutes />}>
        <Route path="/home" element={<Home />} />
        <Route path="/home/:roomId" element={<GameRouter />} />
      </Route>
      <Route path="*" element={<Login />} />
    </Routes>
  )
}
