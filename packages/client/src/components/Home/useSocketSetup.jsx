import { useEffect } from "react"
import { socket } from "../../socket"
import { useAccountProvider } from "../../providers/AccountProvider"
import { useNavigate } from "react-router-dom"
import { useGameProvider } from "../../providers/GameProvider"

export const useSocketSetup = () => {
  const { gamePlayer, setGamePlayer, gameState, setGameState } = useGameProvider()
  const { user, setUser } = useAccountProvider()
  useEffect(() => {
    socket.connect()
    socket.on("connect_error", () => {
      setUser({ loggedIn: false })
    })
    socket.on("initializePlayer", (player) => {
      setGamePlayer(player)
    })
    socket.on("setGameState", (state) => {
      setGameState(state)
      setGamePlayer(state.players[user.username])
    })
    socket.on("notifyPlayers", ({ title, message }) => {
      console.log(title, message)
    })
    return () => {
      socket.off("connect_error")
      socket.off("userConnected")
      socket.off("setPlayersInRoom")
      socket.off("setGameState")
      socket.off("notifyPlayers")
      socket.disconnect()
    }
  }, [])
}
