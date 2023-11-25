import { Button, VStack, Flex, Box } from "@chakra-ui/react"
import { createContext, useState } from "react"
import { useSocketSetup } from "./useSocketSetup"
import { MoonIcon, SunIcon } from "@chakra-ui/icons"
import { useAccountProvider } from "../../providers/AccountProvider"
import { useNavigate } from "react-router-dom"
import { socket } from "../../socket"

export const Home = () => {
  useSocketSetup()
  const navigate = useNavigate()
  const { setUser } = useAccountProvider()
  return (
    <Flex>
      <Box w="25%" p={4}>
        <VStack spacing={4} align="stretch">
          <Button
            colorScheme="blue"
            onClick={async () => {
              const logoutRequest = await fetch("http://192.168.1.118:4000/auth/logout", {
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
                // navigate("/login")
              }
            }}
          >
            Logout
          </Button>
          <Button
            colorScheme="green"
            onClick={() => {
              const roomId = `room-${Math.floor(Math.random() * 9000) + 1000}`
              navigate(`/home/${roomId}`)
              // socket.emit("createRoom", { roomId }, (props) => {
              //   console.log("props", props)
              // })
            }}
          >
            Create a room
          </Button>
          <Button colorScheme="red">Join Room 1</Button>
        </VStack>
      </Box>
      <Box w="75%" p={4}></Box>
    </Flex>
  )
}
