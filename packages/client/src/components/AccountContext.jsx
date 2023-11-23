import { createContext, useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router"

const AccountContext = createContext()
export const useAccountProvider = () => {
  return useContext(AccountContext)
}
export const AccountProvider = ({ children }) => {
  const [user, setUser] = useState({ loggedIn: null })
  const navigate = useNavigate()
  useEffect(() => {
    const getSession = async () => {
      try {
        const response = await fetch("http://localhost:4000/auth/login", {
          method: "GET",
          credentials: "include"
        })
        console.log("response", response)
        if (!response || !response.ok || response.status >= 400) {
          setUser({ loggedIn: false })
          return
        }
        const data = await response.json()
        console.log("data", data)
        if (!data) {
          setUser({ loggedIn: false })
          return
        }
        setUser({ ...data })
        navigate("/home")
      } catch (err) {
        console.log("err", err)
        setUser({ loggedIn: false })
      }
    }
    getSession()
  }, [])
  const contextValue = {
    user,
    setUser
  }
  return <AccountContext.Provider value={contextValue}>{children}</AccountContext.Provider>
}
