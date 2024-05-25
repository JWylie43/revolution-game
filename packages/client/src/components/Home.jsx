import { Button, ButtonGroup, Heading, VStack } from "@chakra-ui/react"
import { useNavigate } from "react-router"
import { useAccountProvider } from "../providers/AccountProvider.jsx"

const Home = () => {
  const navigate = useNavigate()
  const { accountInfo, setAccountInfo } = useAccountProvider()

  const onLogout = async () => {
    const logoutRequest = await fetch(`http://localhost:4000/auth/logout`, {
      method: "DELETE",
      credentials: "include"
    })
    if (!logoutRequest || !logoutRequest.ok || logoutRequest.status >= 400) {
      return
    }
    const data = await logoutRequest.json()
    if (!data) return
    if (data.loggedOut) {
      setAccountInfo({ loggedIn: false })
    }
  }
  return (
    <>
      <Button onClick={onLogout}>Logout</Button>
    </>
  )
}

export default Home
