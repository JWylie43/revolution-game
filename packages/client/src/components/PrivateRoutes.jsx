import { useAccountProvider } from "../providers/AccountProvider.jsx"
import { Outlet, Navigate } from "react-router-dom"

const PrivateRoutes = () => {
  const { accountInfo, setAccountInfo } = useAccountProvider()
  console.log("accountInfo", accountInfo)
  return accountInfo.loggedIn === true ? (
    <Outlet />
  ) : accountInfo.loggedIn === null ? (
    <div>test</div>
  ) : (
    <Navigate to="/login" />
  )
}

export default PrivateRoutes
