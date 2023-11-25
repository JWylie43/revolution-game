import { useAccountProvider } from "./AccountContext"
const { Outlet, Navigate } = require("react-router-dom")

const PrivateRoutes = () => {
  const { user } = useAccountProvider()
  return user && user.loggedIn ? <Outlet /> : <Navigate to="/" />
}
export default PrivateRoutes
