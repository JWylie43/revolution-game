import { Button, Grid, GridItem, IconButton, Text } from "@chakra-ui/react"
import { socket } from "../../socket"
import { useGameProvider } from "../../providers/GameProvider"
import { createContext, useContext, useState } from "react"
import { BidSpace } from "./BidSpace"

export const BiddingBoard = () => {
  const { gamePlayer, setGamePlayer, gameState, setGameState } = useGameProvider()
  const [playerBids, setPlayerBids] = useState(gamePlayer.bids ? gamePlayer.bids : {})
  const [remainingTokens, setRemainingTokens] = useState({ gold: 0, blackmail: 0, force: 0, ...gamePlayer.startingtokens })

  const stateVariables = {
    playerBids,
    setPlayerBids,
    remainingTokens,
    setRemainingTokens
  }
  console.log("gameState", gameState)
  console.log("gamePlayer", gamePlayer)
  return (
    <div>
      {!Object.keys(gamePlayer.bids).length ? (
        <>
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
              setRemainingTokens(gamePlayer.startingtokens)
            }}
          >
            Clear Bids
          </Button>
          <div>
            Remaining Tokens:
            {Object.entries(remainingTokens).map(([token, count], index) => {
              return (
                <Text key={index}>
                  {token}: {count}
                </Text>
              )
            })}
          </div>
        </>
      ) : (
        ""
      )}
      <Grid templateRows="repeat(3, 1fr)" templateColumns="repeat(4, 1fr)" gap={2} p={3}>
        {gameState.bidboard?.map((bidSpace) => {
          return (
            <BidSpace
              key={`bidSpace-${bidSpace.id}`}
              {...{ bidSpace, playerBids, setPlayerBids, remainingTokens, setRemainingTokens }}
            />
          )
        })}
      </Grid>
    </div>
  )
}
