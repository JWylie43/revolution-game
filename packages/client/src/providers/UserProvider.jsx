import { createContext, useState, useEffect, useContext } from "react"

export const AccountContext = createContext()
export const useAccountProvider = () => {
  return useContext(AccountContext)
}
export const AccountProvider = ({ children }) => {
  const [accountInfo, setAccountInfo] = useState({ loggedIn: false })
  useEffect(() => {
    const reloadSession = async () => {
      try {
        const loginResponse = await fetch(`http://localhost:4000/auth/login`, {
          credentials: "include"
        })
        if (!loginResponse || !loginResponse.ok || loginResponse.status >= 400) {
          return
        }
        const data = await loginResponse.json()
        if (!data) {
          return
        }
        setAccountInfo({ ...data })
      } catch (e) {
        console.error("reloadSession", e)
      }
    }
    reloadSession()
  }, [])
  return <AccountContext.Provider value={{ accountInfo, setAccountInfo }}>{children}</AccountContext.Provider>
}
