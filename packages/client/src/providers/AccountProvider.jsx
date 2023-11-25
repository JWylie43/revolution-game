import { useNavigate, useLocation } from "react-router-dom"
import { createContext, useState, useEffect, useContext } from "react"

export const AccountContext = createContext()
export const useAccountProvider = () => {
  return useContext(AccountContext)
}
export const AccountProvider = ({ children }) => {
  const [user, setUser] = useState({ loggedIn: null })
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    const reloadSession = async () => {
      try {
        const userResponse = await fetch("http://192.168.1.118:4000/auth/login", {
          credentials: "include"
        })
        if (!userResponse || !userResponse.ok || userResponse.status >= 400) {
          setUser({ loggedIn: false })
          return
        }
        const data = await userResponse.json()
        if (!data) {
          setUser({ loggedIn: false })
          return
        }
        setUser({ ...data })
        if (location.pathname.includes("/home/")) {
          navigate(location.pathname)
          return
        }
        navigate("/home")
      } catch (e) {
        console.error("reloadSession", e)
      }
    }
    reloadSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <AccountContext.Provider value={{ user, setUser }}>{children}</AccountContext.Provider>
}
