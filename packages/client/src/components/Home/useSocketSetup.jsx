import { useEffect } from "react"
import { socket } from "../../socket"
import { useAccountProvider } from "../../providers/AccountProvider"
import { useNavigate } from "react-router-dom"

export const useSocketSetup = () => {
  const navigate = useNavigate()
  const { setUser } = useAccountProvider()
  useEffect(() => {
    socket.connect()
    socket.on("connect_error", () => {
      setUser({ loggedIn: false })
    })
    socket.on("joinedRoom", (room) => {
      console.log("room", room)
      navigate(`/home/${room}`)
    })
    return () => {
      socket.off("connect_error")
      socket.off("joinedRoom")
      socket.disconnect()
    }
  }, [])
}
