import { socket } from "../../socket"
import { useEffect, useState } from "react"
import { Button } from "@chakra-ui/react"
import { useGameProvider } from "../../providers/GameProvider"
import { ReadyUpScreen } from "../GameStates/ReadyUpScreen"
import { BiddingBoard } from "../GameStates/BiddingBoard"
import { GameBoard } from "../GameStates/GameBoard"
export const GameRouter = () => {
  const { socketUser, setSocketUser, players, setPlayers, gameState, setGameState } = useGameProvider()
  console.log("gameState", gameState)
  console.log("socketUser", socketUser)
  console.log("players", players)
  switch (gameState) {
    case "bidding":
      return <BiddingBoard />
    case "compareBids":
      return <GameBoard />
    default:
      return <ReadyUpScreen />
  }
}
