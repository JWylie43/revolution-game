import { CurrencyDollarIcon, EnvelopeIcon, HandRaisedIcon } from "@heroicons/react/24/solid"
import { useReducer, useState } from "react"

const benefits = {
  support: {
    1: "One Support",
    3: "Three Support",
    5: "Five Support",
    6: "Six Support",
    10: "Tex Support"
  },
  gold: {
    3: "Three Gold",
    5: "Five Gold"
  },
  blackmail: {
    1: "One Blackmail",
    2: "Two Blackmail"
  },
  force: {
    1: "One Force"
  },
  location: {
    fortress: "Influence Fortress",
    harbor: "Influence Harbor",
    tavern: "Influence Tavern",
    townhall: "Influence Town Hall",
    cathedral: "Influence Cathedral",
    plantation: "Influence Plantation",
    market: "Influence Market"
  },
  replace: "Replace one Influence Cube with one of your own",
  swap: "Swap the cubes in any two Influence Spaces"
}
const bidBoardDef = [
  {
    name: "General",
    noForce: true,
    noBlackmail: false,
    benefits: [benefits.support[1], benefits.force[1], benefits.location.fortress],
    id: "general",
    nextSpace: "captain",
    acceptedTokens: { gold: 0, blackmail: 0 }
  },
  {
    name: "Captain",
    noForce: true,
    noBlackmail: false,
    benefits: [benefits.support[1], benefits.force[1], benefits.location.harbor],
    id: "captain",
    nextSpace: "innkeeper",
    acceptedTokens: { gold: 0, blackmail: 0 }
  },
  {
    name: "Innkeeper",
    noForce: false,
    noBlackmail: true,
    benefits: [benefits.support[3], benefits.blackmail[1], benefits.location.tavern],
    id: "innkeeper",
    nextSpace: "magistrate",
    acceptedTokens: { gold: 0, force: 0 }
  },
  {
    name: "Magistrate",
    noForce: false,
    noBlackmail: true,
    benefits: [benefits.support[3], benefits.blackmail[1], benefits.location.townhall],
    id: "magistrate",
    nextSpace: "priest",
    acceptedTokens: { gold: 0, force: 0 }
  },
  {
    name: "Priest",
    noForce: false,
    noBlackmail: false,
    benefits: [benefits.support[6], benefits.location.cathedral],
    id: "priest",
    nextSpace: "aristocrat",
    acceptedTokens: { gold: 0, blackmail: 0, force: 0 }
  },
  {
    name: "Aristocrat",
    noForce: false,
    noBlackmail: false,
    benefits: [benefits.support[5], benefits.gold[3], benefits.location.plantation],
    id: "aristocrat",
    nextSpace: "merchant",
    acceptedTokens: { gold: 0, blackmail: 0, force: 0 }
  },
  {
    name: "Merchant",
    noForce: false,
    noBlackmail: false,
    benefits: [benefits.support[3], benefits.gold[5], benefits.location.market],
    id: "merchant",
    nextSpace: "printer",
    acceptedTokens: { gold: 0, blackmail: 0, force: 0 }
  },
  {
    name: "Printer",
    noForce: false,
    noBlackmail: false,
    benefits: [benefits.support[10]],
    id: "printer",
    nextSpace: "rogue",
    acceptedTokens: { gold: 0, blackmail: 0, force: 0 }
  },
  {
    name: "Rogue",
    noForce: true,
    noBlackmail: true,
    benefits: [benefits.blackmail[2]],
    id: "rogue",
    nextSpace: "spy",
    acceptedTokens: { gold: 0 }
  },
  {
    name: "Spy",
    noForce: false,
    noBlackmail: true,
    benefits: [benefits.replace],
    id: "spy",
    nextSpace: "apothecary",
    acceptedTokens: { gold: 0, force: 0 }
  },
  {
    name: "Apothecary",
    noForce: true,
    noBlackmail: false,
    benefits: [benefits.swap],
    id: "apothecary",
    nextSpace: "mercenary",
    acceptedTokens: { gold: 0, blackmail: 0 }
  },
  {
    name: "Mercenary",
    noForce: true,
    noBlackmail: true,
    benefits: [benefits.support[3], benefits.force[1]],
    id: "mercenary",
    nextSpace: null,
    acceptedTokens: { gold: 0 }
  }
]

export const BidBoard = (params) => {
  const [playerBids, dispatchPlayerBids] = useReducer(
    (state, action) => {
      console.log("reducer", { state, action })
      const updateObject = state[action.id] || { gold: 0, blackmail: 0, force: 0 }
      updateObject[action.token] += action.count

      return { ...state, [action.id]: updateObject }
    },
    Object.fromEntries(
      bidBoardDef.map((item) => {
        return [item.id, item.acceptedTokens]
      })
    )
  )
  console.log("bidBoardDef", bidBoardDef)
  console.log("playerBids", playerBids)
  return (
    <div className="bg-gray-900 w-[1000px] overflow-auto">
      <div className="grid grid-cols-4 gap-4 h-full">
        {bidBoardDef.map((item) => {
          const color = item.noForce
            ? item.noBlackmail
              ? "bg-yellow-700"
              : "bg-red-700"
            : item.noBlackmail
              ? "bg-black"
              : "bg-amber-950"
          return (
            <div key={item.id} className={`${color} rounded items-center justify-top p-4 h-[200px]`}>
              <div className="text-lg font-bold text-center truncate">{item.name}</div>
              {item.benefits.map((benefit, index) => (
                <div key={index} className="text-sm text-center">
                  {benefit}
                </div>
              ))}
              <div className={"flex flex-row"}>
                <div>
                  <CurrencyDollarIcon
                    strokeWidth={2}
                    className={"h-6 w-6"}
                    onClick={() => {
                      dispatchPlayerBids({ id: item.id, token: "gold", count: 1 })
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      dispatchPlayerBids({ id: item.id, token: "gold", count: -1 })
                    }}
                  />
                  {playerBids[item.id]?.gold}
                </div>
                <div>
                  <EnvelopeIcon
                    strokeWidth={2}
                    className={"h-6 w-6"}
                    onClick={() => {
                      dispatchPlayerBids({ id: item.id, token: "blackmail", count: 1 })
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      dispatchPlayerBids({ id: item.id, token: "blackmail", count: -1 })
                    }}
                  />
                  {playerBids[item.id]?.blackmail}
                </div>
                <div>
                  <HandRaisedIcon
                    strokeWidth={2}
                    className={"h-6 w-6"}
                    onClick={() => {
                      dispatchPlayerBids({ id: item.id, token: "force", count: 1 })
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      dispatchPlayerBids({ id: item.id, token: "force", count: -1 })
                    }}
                  />
                  {playerBids[item.id]?.force}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
