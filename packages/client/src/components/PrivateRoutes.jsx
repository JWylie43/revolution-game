import { Navigate, Outlet } from "react-router-dom"
import { useAccountProvider } from "./AccountContext"

const useAuth = () => {
  const { user } = useAccountProvider()
  return user && user.loggedIn
}
export const PrivateRoutes = () => {
  const isAuth = useAuth()
  return isAuth ? <Outlet /> : <Navigate to={"/"} />
}
