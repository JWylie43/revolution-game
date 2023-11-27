import { useEffect } from "react"
import { socket } from "../../socket"
import { useAccountProvider } from "../../providers/AccountProvider"
import { useNavigate } from "react-router-dom"
import { useGameProvider } from "../../providers/GameProvider"

export const useSocketSetup = () => {
  const { socketUser, setSocketUser, players, setPlayers, gameState, setGameState } = useGameProvider()
  const { setUser } = useAccountProvider()
  useEffect(() => {
    socket.connect()
    socket.on("connect_error", () => {
      setUser({ loggedIn: false })
    })
    socket.on("updateSocketUser", (user) => {
      setSocketUser(user)
    })
    socket.on("setPlayersInRoom", (players) => {
      setPlayers(players)
    })
    socket.on("setGameState", (state) => {
      setGameState(state)
    })
    return () => {
      socket.off("connect_error")
      socket.off("userConnected")
      socket.off("setPlayersInRoom")
      socket.off("setGameState")
      socket.disconnect()
    }
  }, [])
}
