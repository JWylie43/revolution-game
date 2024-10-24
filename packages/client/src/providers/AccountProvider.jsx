import { createContext, useState, useEffect, useContext } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ipAddress } from "../constants.js"

export const AccountContext = createContext()
export const useAccountProvider = () => {
  return useContext(AccountContext)
}
export const AccountProvider = ({ children }) => {
  const [accountInfo, setAccountInfo] = useState({ loggedIn: null })

  const login = async ({ username, password, register }) => {
    const response = await fetch(`http://${ipAddress}:4000/auth/${register ? "register" : "login"}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    })
    if (!response || !response.ok || response.status >= 400) {
      return
    }
    const data = await response.json()
    console.log("login data", data)
    if (!data) {
      return
    }
    setAccountInfo({ ...data })
    return data.loggedIn
  }

  const logout = async () => {
    const logoutRequest = await fetch(`http://${ipAddress}:4000/auth/logout`, {
      method: "DELETE",
      credentials: "include"
    })
    if (!logoutRequest || !logoutRequest.ok || logoutRequest.status >= 400) {
      return
    }
    const data = await logoutRequest.json()
    console.log("logout data", data)
    if (!data) return
    if (data.loggedOut) {
      setAccountInfo({ loggedIn: false })
    }
  }

  useEffect(() => {
    const reloadSession = async () => {
      try {
        const loginResponse = await fetch(`http://${ipAddress}:4000/auth/login`, {
          credentials: "include"
        })
        if (!loginResponse || !loginResponse.ok || loginResponse.status >= 400) {
          return
        }
        const data = await loginResponse.json()
        console.log("loginResponse data", data)
        if (!data) {
          return
        }
        setAccountInfo({ ...data })
        // navigate(location.pathname)
      } catch (e) {
        console.error("reloadSession", e)
      }
    }
    reloadSession()
  }, [])
  return <AccountContext.Provider value={{ accountInfo, setAccountInfo, login, logout }}>{children}</AccountContext.Provider>
}
