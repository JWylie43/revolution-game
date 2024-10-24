import { createContext, useState, useEffect, useContext } from "react"
import { io } from "socket.io-client"
import { ipAddress } from "../constants.js"

export const SocketContext = createContext()
export const useSocketProvider = () => {
  return useContext(SocketContext)
}
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [playerInfo, setPlayerInfo] = useState({})
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socketConnection = new io(`http://${ipAddress}:4000`, {
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
    socketConnection.on("playerInfo", (data) => {
      setPlayerInfo(data)
    })
    socketConnection.on("serverNotification", (data) => {
      alert(data)
    })
    setSocket(socketConnection)
    return () => {
      socketConnection.disconnect()
    }
  }, [])

  return <SocketContext.Provider value={{ socket, connected, playerInfo }}>{children}</SocketContext.Provider>
}
