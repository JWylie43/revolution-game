import { Button, Grid, GridItem, IconButton, Text } from "@chakra-ui/react"
import { socket } from "../../socket"
import { useGameProvider } from "../../providers/GameProvider"
import { createContext, useContext, useState } from "react"
import { BidSpace } from "./BidSpace"

export const BiddingBoard = () => {
  const { socketUser, setSocketUser, players, setPlayers, gameState, setGameState } = useGameProvider()
  const [playerBids, setPlayerBids] = useState(socketUser.bids ? socketUser.bids : {})
  const [startingTokens, setStartingTokens] = useState(
    socketUser.bids ? { gold: 0, blackmail: 0, force: 0 } : { gold: 3, blackmail: 1, force: 1 }
  )
  const [remainingTokens, setRemainingTokens] = useState(startingTokens)

  const stateVariables = {
    playerBids,
    setPlayerBids,
    remainingTokens,
    setRemainingTokens
  }
  return (
    <div>
      {gameState.phase === "bidding" ? (
        <>
          {" "}
          <Button
            onClick={() => {
              if (
                Object.values(remainingTokens).reduce((current, result) => {
                  result += current
                  return result
                }, 0) === 0
              ) {
                socket.emit("submitBids", playerBids)
              }
            }}
          >
            Submit Bids
          </Button>
          <Button
            onClick={() => {
              setPlayerBids({})
              setRemainingTokens(startingTokens)
            }}
          >
            Clear Bids
          </Button>
          <Text>
            Remaining Tokens:
            {Object.entries(remainingTokens).map(([token, count]) => {
              return (
                <Text>
                  {token}: {count}
                </Text>
              )
            })}
          </Text>
        </>
      ) : (
        ""
      )}
      <Grid
        templateRows="repeat(3, 1fr)"
        templateColumns="repeat(4, 1fr)"
        gap={2} // Adjust the gap as needed
        p={3} // Adjust padding as needed
      >
        {gameState.bidBoard?.map((space) => {
          return <BidSpace {...{ space, ...stateVariables }} />
        })}
      </Grid>
    </div>
  )
}
