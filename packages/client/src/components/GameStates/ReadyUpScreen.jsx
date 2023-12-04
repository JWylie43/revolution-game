import { Button } from "@chakra-ui/react"
import { socket } from "../../socket"
import { useGameProvider } from "../../providers/GameProvider"

export const ReadyUpScreen = () => {
  const { gamePlayer, setGamePlayer, gameState, setGameState } = useGameProvider()
  return (
    <div>
      Room: {gamePlayer.room}
      <Button
        onClick={() => {
          socket.emit("setReadyUp")
        }}
      >
        Ready Up
      </Button>
      {Object.values(gameState.players).map((player) => {
        return (
          <div key={player.userid}>
            Username: {player.username} | Ready: {player.ready ? "yes" : "no"}
          </div>
        )
      })}
    </div>
  )
}
