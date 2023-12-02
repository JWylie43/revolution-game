import { Button } from "@chakra-ui/react"
import { socket } from "../../socket"
import { useGameProvider } from "../../providers/GameProvider"

export const ReadyUpScreen = () => {
  const { socketUser, setSocketUser, players, setPlayers, gameState, setGameState } = useGameProvider()
  console.log("gameState", gameState)

  return (
    <div>
      Room: {socketUser.room}
      <Button
        onClick={() => {
          socket.emit("setReadyUp")
        }}
      >
        Ready Up
      </Button>
      {gameState?.players?.map((player) => {
        return (
          <div key={player.userid}>
            Username: {player.username} | Ready: {player.ready ? "yes" : "no"}
          </div>
        )
      })}
    </div>
  )
}
