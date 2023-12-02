import { Container, Flex, Grid, GridItem, IconButton, Text } from "@chakra-ui/react"
import { GiTwoCoins } from "react-icons/gi"
import { BidIcon } from "./BidIcon"
import { useGameProvider } from "../../providers/GameProvider"

export const BidSpace = (props) => {
  const { space, playerBids } = props
  const { gameState } = useGameProvider()
  let backgroundColor = ""
  let acceptedTokens = []
  if (space.noForce && !space.noBlackmail) {
    backgroundColor = "red"
    acceptedTokens = ["gold", "blackmail"]
  } else if (space.noBlackmail && !space.noForce) {
    backgroundColor = "black"
    acceptedTokens = ["gold", "force"]
  } else if (space.noBlackmail && space.noForce) {
    backgroundColor = "orange"
    acceptedTokens = ["gold"]
  } else {
    backgroundColor = "#6F4E37"
    acceptedTokens = ["gold", "blackmail", "force"]
  }
  if (gameState.phase !== "bidding") {
    const playerBidComponent = gameState.players.map((player, index) => {
      const playerBidIcons = (
        <GridItem>
          {gameState.bidResults[space.id]?.winner === player.username
            ? "Winner"
            : gameState.bidResults[space.id]?.tie?.includes(player.username)
              ? "Tie"
              : ""}
          <Text>{player.username}</Text>
          <Flex justifyContent={"center"}>
            {acceptedTokens.map((token) => {
              if (!player.bids[space.id]?.[token] || player.bids[space.id]?.[token] === 0) {
                return ""
              }
              return (
                <div>
                  <BidIcon {...{ token, ...props }} />
                  <Text>{player.bids[space.id]?.[token] ?? 0}</Text>
                </div>
              )
            })}
          </Flex>
        </GridItem>
      )
      if (index === 0) {
        return (
          <>
            {playerBidIcons}
            <GridItem rowSpan={2}>
              {space.name}
              {space.benefits.map((benefit) => {
                return <div>{benefit.name}</div>
              })}
            </GridItem>
          </>
        )
      }
      return playerBidIcons
    })
    return (
      <GridItem key={space.id} style={{ border: "solid black 1px", textAlign: "center", backgroundColor }}>
        <Grid templateRows={`repeat(${gameState.players.length > 2 ? 2 : 1}, 1fr)`} templateColumns="repeat(3, 1fr)" gap={1}>
          {playerBidComponent}
        </Grid>
      </GridItem>
    )
  }
  return (
    <GridItem key={space.id} style={{ border: "solid black 1px", textAlign: "center", backgroundColor }}>
      {space.name}
      {space.benefits.map((benefit) => {
        return <div>{benefit.name}</div>
      })}
      <Flex justifyContent={"center"}>
        {acceptedTokens.map((token) => {
          return (
            <div>
              <BidIcon {...{ token, ...props }} />
              <Text>{playerBids[space.id]?.[token] ?? 0}</Text>
            </div>
          )
        })}
      </Flex>
    </GridItem>
  )
}
