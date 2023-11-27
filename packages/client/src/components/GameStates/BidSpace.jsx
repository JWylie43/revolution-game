import { Container, Flex, GridItem, IconButton, Text } from "@chakra-ui/react"
import { GiTwoCoins } from "react-icons/gi"
import { BidIcon } from "./BidIcon"

export const BidSpace = (props) => {
  const { space, playerBids } = props
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
