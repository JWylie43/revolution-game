import { Button, Grid, GridItem, IconButton } from "@chakra-ui/react"
import { socket } from "../../socket"
import { useGameProvider } from "../../providers/GameProvider"
import { GiPunch, GiTwoCoins } from "react-icons/gi"
import { MdMailLock } from "react-icons/md"

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
  console.log("bidBoard", bidBoard)
  return (
    <div>
      <Button
        onClick={() => {
          socket.emit("submitBids")
        }}
      >
        Submit Bids
      </Button>
      <Grid
        templateRows="repeat(3, 1fr)"
        templateColumns="repeat(4, 1fr)"
        gap={2} // Adjust the gap as needed
        p={3} // Adjust padding as needed
      >
        {bidBoard.map((space) => {
          console.log("space", space)
          let backgroundColor = ""
          if (space.noForce) {
            backgroundColor = "red"
          } else if (space.noBlackmail) {
            backgroundColor = "black"
          } else {
            backgroundColor = "#6F4E37"
          }

          return (
            <GridItem
              key={space.id}
              style={{ border: "solid black 1px", textAlign: "center", backgroundColor: backgroundColor }}
            >
              {space.name}
              {space.benefits.map((benefit) => {
                return <div>{benefit.name}</div>
              })}
              <IconButton bg="yellow" icon={<GiPunch />} />
              <IconButton bg="yellow" icon={<GiTwoCoins />} />
              <IconButton bg="yellow" icon={<MdMailLock />} />
            </GridItem>
          )
        })}
      </Grid>
    </div>
  )
}
