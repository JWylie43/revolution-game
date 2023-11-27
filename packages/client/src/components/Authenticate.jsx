import { useAccountProvider } from "../providers/AccountProvider"
import { Home } from "./Home/Home"
import { useState } from "react"
import { Login } from "./Login/Login"
import { SignUp } from "./Login/SignUp"
import { useNavigate, useLocation } from "react-router-dom"
import { GameProvider } from "../providers/GameProvider"

export const Authenticate = () => {
  const [action, setAction] = useState("login")
  const navigate = useNavigate()
  const { user } = useAccountProvider()
  if (user.loggedIn) {
    return (
      <GameProvider>
        <Home {...{ setAction }} />
      </GameProvider>
    )
  }
  if (location.hash) {
    navigate("/", { replace: true })
  }
  switch (action) {
    case "login":
      return <Login {...{ setAction }} />
    case "register":
      return <SignUp {...{ setAction }} />
    default:
      return <Login {...{ setAction }} />
  }
}
