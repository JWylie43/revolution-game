import { Button, Grid, GridItem } from "@chakra-ui/react"
import { socket } from "../../socket"
import { useGameProvider } from "../../providers/GameProvider"

export const GameBoard = () => {
  const { socketUser, setSocketUser, players, setPlayers, gameState, setGameState } = useGameProvider()

  return (
    <div>
      <Button
        onClick={() => {
          socket.emit("submitBids")
        }}
      >
        Submit Bids
      </Button>
    </div>
  )
}
