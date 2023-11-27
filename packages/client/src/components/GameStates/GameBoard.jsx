import { Button, Grid, GridItem, Text } from "@chakra-ui/react"
import { socket } from "../../socket"
import { useGameProvider } from "../../providers/GameProvider"

export const GameBoard = () => {
  const { socketUser, setSocketUser, players, setPlayers, gameState, setGameState } = useGameProvider()
  console.log("players", players)
  return (
    <div>
      <Text>Game Board</Text>
    </div>
  )
}
