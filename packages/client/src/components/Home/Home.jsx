import { Button, VStack, Flex, Box, Tabs, TabList, TabPanels, Tab, TabPanel, Container, Text } from "@chakra-ui/react"
import { createContext, useEffect, useState } from "react"
import { useSocketSetup } from "./useSocketSetup"
import { MoonIcon, SunIcon } from "@chakra-ui/icons"
import { useAccountProvider } from "../../providers/AccountProvider"
import { useGameProvider } from "../../providers/GameProvider"
import { Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { GameRouter } from "./GameRouter"
import { socket } from "../../socket"
import { ipaddress } from "@revolution-game/common"

export const Home = ({ setAction }) => {
  const { socketUser, setSocketUser, players, setPlayers, gameState } = useGameProvider()
  const { user, setUser } = useAccountProvider()
  const location = useLocation()
  const navigate = useNavigate()
  console.log("gameState", gameState)
  useSocketSetup()
  useEffect(() => {
    if (!socketUser.username) {
      return
    }
    if (!socketUser.room && location.hash) {
      socket.emit("joinGame", location.hash.replace("#", ""), (path = "") => {
        navigate(`/${path}`)
        window.location.reload()
      })
    }
  }, [socketUser, location, gameState])
  if (!socketUser.connected) {
    return <div>connecting...</div>
  }
  if (socketUser.room) {
    return (
      <>
        <Button
          onClick={() => {
            navigate("/")
            window.location.reload()
          }}
        >
          Leave Game
        </Button>
        <GameRouter />
      </>
    )
  }
  const onLogout = async () => {
    const logoutRequest = await fetch(`http://${ipaddress}:4000/auth/logout`, {
      method: "DELETE",
      credentials: "include"
    })
    if (!logoutRequest || !logoutRequest.ok || logoutRequest.status >= 400) {
      return
    }
    const data = await logoutRequest.json()
    if (!data) return
    if (!data.loggedOut) {
      console.error(data.status)
    }
    if (data.loggedOut) {
      setUser({ loggedIn: false })
      setAction("login")
    }
  }
  const onCreateRoom = () => {
    const roomId = `room-${Math.floor(Math.random() * 9000) + 1000}`

    navigate(`/#${roomId}`)
    // window.location.assign(`/#${roomId}`)
    // // window.location.reload()
  }
  const onRejoinGame = () => {
    navigate(`/#${socketUser.rejoinroom}`)
    // window.location.reload()
  }
  return (
    <>
      <Text>User: {socketUser.username}</Text>
      <Button onClick={onLogout}>Logout</Button>
      <Button onClick={onCreateRoom}>Create Room</Button>
      {socketUser.rejoinroom ? <Button onClick={onRejoinGame}>Rejoin Game</Button> : ""}
    </>
  )
}
