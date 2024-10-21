import { createContext, useState, useEffect, useContext } from "react"
import { io } from "socket.io-client"

export const SocketContext = createContext()
export const useSocketProvider = () => {
  return useContext(SocketContext)
}
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [userInformation, setUserInformation] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socketConnection = new io("http://192.168.86.41:4000", {
      autoConnect: false,
      withCredentials: true
    })
    socketConnection.connect()
    socketConnection.on("connect_error", (error) => {
      console.error("Connection error:", error)
    })
    socketConnection.on("connect", () => {
      console.warn("Successfully connected to the socket server")
      setConnected(true)
    })
    socketConnection.on("userInfo", (user) => {
      console.log("User info:", user)
    })
    setSocket(socketConnection)
    return () => {
      socketConnection.disconnect()
    }
  }, [])

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>
}
