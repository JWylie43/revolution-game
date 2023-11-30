import { Button, Grid, GridItem, Text, Box, Flex, Container } from "@chakra-ui/react"
import { socket } from "../../socket"
import { useGameProvider } from "../../providers/GameProvider"
import GameBoardImage from "../../../public/GameBoardImage.png"
import { useState, useEffect, useRef } from "react"
import { Space } from "react-zoomable-ui"
import "../../app.css"

export const GameBoard = () => {
  const { socketUser, setSocketUser, players, setPlayers, gameState, setGameState } = useGameProvider()
  console.log("gameState", gameState)
  return (
    <Button
      onClick={() => {
        socket.emit("compareBids", (a) => {
          console.log("callback", a)
        })
      }}
    >
      Compare Bids
    </Button>
  )
}
