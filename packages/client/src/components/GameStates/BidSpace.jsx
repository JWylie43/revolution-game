import { Container, Flex, Grid, GridItem, IconButton, Text } from "@chakra-ui/react"
import { GiTwoCoins } from "react-icons/gi"
import { BidIcon } from "./BidIcon"
import { useGameProvider } from "../../providers/GameProvider"

export const BidSpace = (props) => {
  const { bidSpace, playerBids } = props
  const { gameState } = useGameProvider()
  let backgroundColor = ""
  let acceptedTokens = []
  if (bidSpace.noForce && !bidSpace.noBlackmail) {
    backgroundColor = "red"
    acceptedTokens = ["gold", "blackmail"]
  } else if (bidSpace.noBlackmail && !bidSpace.noForce) {
    backgroundColor = "black"
    acceptedTokens = ["gold", "force"]
  } else if (bidSpace.noBlackmail && bidSpace.noForce) {
    backgroundColor = "orange"
    acceptedTokens = ["gold"]
  } else {
    backgroundColor = "#6F4E37"
    acceptedTokens = ["gold", "blackmail", "force"]
  }
  if (gameState.phase !== "bidding") {
    return (
      <GridItem style={{ border: "solid black 1px", textAlign: "center", backgroundColor }}>
        <Grid
          templateAreas={`"player-1 benefits player-2"${gameState.players.length > 2 ? "player-3 benefits player-4" : ""}`}
          // templateRows={`repeat(${gameState.players.length > 2 ? 2 : 1}, 1fr)`}
          // templateColumns="repeat(3, 1fr)"
          gap={1}
        >
          <GridItem area={"benefits"}>
            {bidSpace.name}
            {bidSpace.benefits.map((benefit, index) => {
              return <div key={index}>{benefit.name}</div>
            })}
          </GridItem>
          {Object.values(gameState.players).map((player, index) => {
            return (
              <GridItem area={`player-${index + 1}`} key={index}>
                {gameState.highestbids[bidSpace.id]?.winner === player.username
                  ? "Winner"
                  : gameState.highestbids[bidSpace.id]?.tie?.includes(player.username)
                    ? "Tie"
                    : ""}
                <Text>{player.username}</Text>
                <Flex justifyContent={"center"}>
                  {acceptedTokens.map((token, index) => {
                    if (!player.bids[bidSpace.id]?.[token] || player.bids[bidSpace.id]?.[token] === 0) {
                      return ""
                    }
                    return (
                      <div key={index}>
                        <BidIcon {...{ token, ...props }} />
                        <Text>{player.bids[bidSpace.id]?.[token] ?? 0}</Text>
                      </div>
                    )
                  })}
                </Flex>
              </GridItem>
            )
          })}
        </Grid>
      </GridItem>
    )
  }
  return (
    <GridItem style={{ border: "solid black 1px", textAlign: "center", backgroundColor }}>
      {bidSpace.name}
      {bidSpace.benefits.map((benefit, index) => {
        return <div key={index}>{benefit.name}</div>
      })}
      <Flex justifyContent={"center"}>
        {acceptedTokens.map((token, index) => {
          return (
            <div key={index}>
              <BidIcon {...{ token, ...props }} />
              <Text>{playerBids[bidSpace.id]?.[token] ?? 0}</Text>
            </div>
          )
        })}
      </Flex>
    </GridItem>
  )
}
