import { createContext, useState, useEffect, useContext } from "react"
import { ipaddress } from "@revolution-game/common"

export const AccountContext = createContext()
export const useAccountProvider = () => {
  return useContext(AccountContext)
}
export const AccountProvider = ({ children }) => {
  const [user, setUser] = useState({ loggedIn: null })
  useEffect(() => {
    const reloadSession = async () => {
      try {
        const userResponse = await fetch(`http://${ipaddress}:4000/auth/login`, {
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
      } catch (e) {
        console.error("reloadSession", e)
      }
    }
    reloadSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <AccountContext.Provider value={{ user, setUser }}>{children}</AccountContext.Provider>
}
