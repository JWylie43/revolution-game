import { useAccountProvider } from "../providers/AccountProvider.jsx"
import { useNavigate, useLocation, useParams, Navigate } from "react-router-dom"
import { useSocketProvider } from "../providers/SocketProvider.jsx"
import { useEffect, useState } from "react"
import { Button } from "@chakra-ui/react"
import { BidBoard } from "./bid-board.jsx"

export const Lobby = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { accountInfo, setAccountInfo, logout } = useAccountProvider()
  const { socket } = useSocketProvider()
  const [playersInLobby, setPlayersInLobby] = useState([])
  const [playersInGame, setPlayersInGame] = useState([])
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [gameState, setGameState] = useState(null)

  // if (!/^[a-zA-Z0-9]{4,6}$/.test(roomId)) {
  //   return <div>This is not a valid page.</div>
  // }
  console.log("gameState", gameState)
  useEffect(() => {
    socket.emit("joinRoom", { roomId })
    socket.on("playerJoinedLobby", (data) => {
      console.log("playerJoinedLobby", data) // Notify the current user
    })
    socket.on("playerLeftLobby", (data) => {
      console.log("playerLeftLobby", data) // Notify the current user
    })
    socket.on("playersInLobby", (data) => {
      console.log("playersInLobby", data) // Notify the current user
      setPlayersInLobby(data)
    })
    socket.on("gameState", (data) => {
      console.log("gameState", data)
      setGameState(data)
    })
    socket.on("playerRejoinedGame", (data) => {
      console.log("playerRejoinedGame", data) // Notify the current user
    })
    socket.on("playerDisconnectedFromGame", (data) => {
      console.log("playerLeftGame", data) // Notify the current user
    })
    socket.on("playersInGame", (data) => {
      console.log("playersInGame", data) // Notify the current user
      setPlayersInGame(data)
    })
    socket.on("startGame", (data) => {
      console.log("startGame", data) // Notify the current user
      setGameState("bidding")
      setPlayersInGame(data)
    })
    socket.on("endGame", (data) => {
      console.log("endGame", data) // Notify the current user
      // setGameState("end")
      navigate("/")
    })
    socket.on("errorJoiningRoom", (data) => {
      console.log("errorJoiningRoom", data) // Notify the current user
      navigate("/")
    })
    return () => {
      if (socket) {
        socket.emit("leaveRoom", { roomId }) // Emit leaveRoom event to the server
      }
    }
  }, [])
  if (gameState) {
    if (gameState === "bidding") {
      return <BidBoard />
    }
    return (
      <>
        <div>{gameState}</div>
        <div>
          players in room:
          {playersInGame.map((player) => {
            return (
              <div>
                {player.username} - connected: {player.connected}
              </div>
            )
          })}
        </div>
      </>
    )
  }
  return (
    <>
      <div>lobby</div>
      <Button
        onClick={() => {
          navigate("/")
        }}
      >
        Home
      </Button>
      <Button
        onClick={() => {
          socket.emit("toggleReady", !isPlayerReady)
          setIsPlayerReady(!isPlayerReady)
        }}
      >
        Toggle Ready: {isPlayerReady.toString()}
      </Button>
      <div>
        players in room:
        {playersInLobby.map((player) => {
          return (
            <div>
              {player.username} - isReady: {player.isReady}
            </div>
          )
        })}
      </div>
    </>
  )
}

export default Lobby
