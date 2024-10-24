import { Button, ButtonGroup, Heading, VStack } from "@chakra-ui/react"
import { useAccountProvider } from "../providers/AccountProvider.jsx"
import { useNavigate, useLocation } from "react-router-dom"
import { useSocketProvider } from "../providers/SocketProvider.jsx"
import { useEffect, useState } from "react"

export const Home = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { accountInfo, setAccountInfo, logout } = useAccountProvider()
  const { socket, connected, playerInfo } = useSocketProvider()
  console.log("socket", socket)
  useEffect(() => {
    socket.emit("getPlayerInfo")
    return () => {}
  }, [])
  console.log("playerInfo", playerInfo)
  return (
    <div>
      {playerInfo.gameId && (
        <>
          <Button
            onClick={() => {
              navigate(`/${playerInfo.gameId}`)
            }}
          >
            Rejoin Game: {playerInfo.gameId}
          </Button>
          <Button
            onClick={() => {
              socket.emit("leaveGame")
            }}
          >
            Leave Game Forever: {playerInfo.gameId}
          </Button>
        </>
      )}
      <Button onClick={() => navigate("/")}>Home</Button>
      {/*<Button onClick={() => navigate("/leaderboard")}>Leaderboards</Button>*/}
      {/*<Button onClick={() => logout()}>Logout</Button>*/}
      <Button onClick={logout}>Logout</Button>
      <Button
        onClick={() => {
          const characters = "abcdefghijklmnopqrstuvwxyz0123456789"
          let lobbyId = ""
          for (let i = 0; i < 4; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length)
            lobbyId += characters[randomIndex]
          }
          navigate(`/${lobbyId}`)
        }}
      >
        Create Room
      </Button>
    </div>
  )
}
