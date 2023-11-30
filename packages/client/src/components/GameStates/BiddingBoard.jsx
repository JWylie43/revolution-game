import { Button, Grid, GridItem, IconButton, Text } from "@chakra-ui/react"
import { socket } from "../../socket"
import { GameContext, useGameProvider } from "../../providers/GameProvider"
import { GiPunch, GiTwoCoins } from "react-icons/gi"
import { MdMailLock } from "react-icons/md"
import { createContext, useContext, useState } from "react"
import { BidIcon } from "./BidIcon"
import { BidSpace } from "./BidSpace"

const benefits = {
  oneSupport: {
    name: "One Support",
    benefit: "onesupport"
  },
  threeSupport: {
    name: "Three Support",
    benefit: "threesupport"
  },
  fiveSupport: {
    name: "Five Support",
    benefit: "fivesupport"
  },
  sixSupport: {
    name: "Six Support",
    benefit: "sixsupport"
  },
  tenSupport: {
    name: "Ten Support",
    benefit: "tensupport"
  },
  threeGold: {
    name: "Three Gold",
    benefit: "threegold"
  },
  fiveGold: {
    name: "Five Gold",
    benefit: "fivegold"
  },
  oneBlackmail: {
    name: "One Blackmail",
    benefit: "oneblackmail"
  },
  twoBlackmail: {
    name: "Two Blackmail",
    benefit: "twoblackmail"
  },
  oneForce: {
    name: "One Force",
    benefit: "oneforce"
  },
  fortress: {
    name: "Influence Fortress",
    benefit: "influencefortress"
  },
  harbor: {
    name: "Influence Harbor",
    benefit: "influenceharbor"
  },
  tavern: {
    name: "Influence Tavern",
    benefit: "influencetavern"
  },
  townHall: {
    name: "Influence Town Hall",
    benefit: "influencetownhall"
  },
  cathedral: {
    name: "Influence Cathedral",
    benefit: "influencecathedral"
  },
  plantation: {
    name: "Influence Plantation",
    benefit: "influenceplantation"
  },
  market: {
    name: "Influence Market",
    benefit: "influencemarket"
  },
  replace: { name: "Replace one Influence Cube with one of your own", benefit: "replace" },
  swap: { name: "Swap the cubes in any two Influence Spaces", benefit: "swap" }
}
const bidBoard = [
  {
    name: "General",
    noForce: true,
    noBlackmail: false,
    benefits: [benefits.oneSupport, benefits.oneForce, benefits.fortress],
    id: "general",
    nextSpace: "captain"
  },
  {
    name: "Captain",
    noForce: true,
    noBlackmail: false,
    benefits: [benefits.oneSupport, benefits.oneForce, benefits.harbor],
    id: "captain",
    nextSpace: "innkeeper"
  },
  {
    name: "Innkeeper",
    noForce: false,
    noBlackmail: true,
    benefits: [benefits.threeSupport, benefits.oneBlackmail, benefits.tavern],
    id: "innkeeper",
    nextSpace: "magistrate"
  },
  {
    name: "Magistrate",
    noForce: false,
    noBlackmail: true,
    benefits: [benefits.threeSupport, benefits.oneBlackmail, benefits.townHall],
    id: "magistrate",
    nextSpace: "priest"
  },
  {
    name: "Priest",
    noForce: false,
    noBlackmail: false,
    benefits: [benefits.sixSupport, benefits.cathedral],
    id: "priest",
    nextSpace: "aristocrat"
  },
  {
    name: "Aristocrat",
    noForce: false,
    noBlackmail: false,
    benefits: [benefits.fiveSupport, benefits.threeGold, benefits.plantation],
    id: "aristocrat",
    nextSpace: "merchant"
  },
  {
    name: "Merchant",
    noForce: false,
    noBlackmail: false,
    benefits: [benefits.threeSupport, benefits.fiveGold, benefits.market],
    id: "merchant",
    nextSpace: "printer"
  },
  {
    name: "Printer",
    noForce: false,
    noBlackmail: false,
    benefits: [benefits.tenSupport],
    id: "printer",
    nextSpace: "rogue"
  },
  {
    name: "Rogue",
    noForce: true,
    noBlackmail: true,
    benefits: [benefits.twoBlackmail],
    id: "rogue",
    nextSpace: "spy"
  },
  {
    name: "Spy",
    noForce: false,
    noBlackmail: true,
    benefits: [benefits.replace],
    id: "spy",
    nextSpace: "apothecary"
  },
  {
    name: "Apothecary",
    noForce: true,
    noBlackmail: false,
    benefits: [benefits.swap],
    id: "apothecary",
    nextSpace: "mercenary"
  },
  {
    name: "Mercenary",
    noForce: true,
    noBlackmail: true,
    benefits: [benefits.threeSupport, benefits.oneForce],
    id: "mercenary",
    nextSpace: null
  }
]

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
      <Grid
        templateRows="repeat(3, 1fr)"
        templateColumns="repeat(4, 1fr)"
        gap={2} // Adjust the gap as needed
        p={3} // Adjust padding as needed
      >
        {bidBoard.map((space) => {
          return <BidSpace {...{ space, ...stateVariables }} />
        })}
      </Grid>
    </div>
  )
}
