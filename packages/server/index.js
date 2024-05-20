require("dotenv").config()
const express = require("express")
const { Server } = require("socket.io")
const helmet = require("helmet")
const cors = require("cors")
const authRouter = require("./routers/authRouter")
const session = require("express-session")
// const redisClient = require("./redis")

// const { initializeUser, addFriend, onDisconnect, authorizeUser, dm } = require("./controllers/socketController")
// const redisClient = require("./redis")

const app = express()
const server = require("http").createServer(app)
// const io = new Server(server, {
//   cors: {
//     origin: `http://localhost:5173`,
//     credentials: true
//   }
// })

app.use(helmet())
app.use(express.json())
app.use(
  cors({
    origin: `http://localhost:5173`,
    credentials: true
  })
)
app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    credentials: true,
    name: "sid",
    // store: new RedisStore({ client: redisClient }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production" ? "true" : "auto",
      httpOnly: true,
      expires: 1000 * 60 * 60 * 24 * 7,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
  })
)

// io.on("connect", async (socket) => {
//   console.log("socket", socket)
// })

app.use("/auth", authRouter)
// io.use(wrap(sessionMiddleware))
// io.use(authorizeUser)

// io.on("connect", async (socket) => {
//   console.log("connecting")
//   const { username, userid } = socket.request.session.user
//   socket.username = username
//   // socket.emit("notifyPlayers", { title: "redisUser", message: await redisClient.get(`username:${username}`) })
//
//   const initializePlayer = {
//     ...JSON.parse(await redisClient.get(`username:${username}`)),
//     username,
//     userid,
//     connected: true
//   }
//   // socket.emit("notifyPlayers", { title: "initializePlayer", message: initializePlayer })
//   if (initializePlayer.room) {
//     initializePlayer.rejoinroom = initializePlayer.room
//     initializePlayer.room = null
//   }
//   // socket.emit("notifyPlayers", { title: "initializePlayer", message: initializePlayer })
//   await redisClient.set(`username:${username}`, JSON.stringify(initializePlayer))
//   socket.emit("initializePlayer", initializePlayer)
//
//   socket.on("joinGame", async (roomId, callback) => {
//     socket.rooms.forEach((room) => {
//       socket.leave(room)
//     })
//     let playerData = JSON.parse(await redisClient.get(`username:${socket.username}`))
//     if (playerData.rejoinroom && playerData.rejoinroom !== roomId) {
//       callback(`#${playerData.rejoinroom}`)
//       return
//     }
//     const gameState = JSON.parse(await redisClient.get(`gamestate:${roomId}`)) || {
//       phase: "lobby",
//       players: {},
//       round: 1,
//       highestbids: {},
//       bidboard: bidBoard,
//       gameboard: gameBoard
//     }
//
//     const playerInGame = gameState.players[playerData.username]
//     const maximumPlayersMet = Object.keys(gameState.players).length >= 4
//     if (!playerInGame && (gameState?.phase !== "lobby" || maximumPlayersMet)) {
//       callback()
//       return
//     }
//     socket.join(roomId)
//     playerData = { ...playerData, room: roomId, rejoinroom: null }
//     await redisClient.set(`username:${playerData.username}`, JSON.stringify(playerData))
//     gameState.players = { ...gameState.players, [playerData.username]: playerData }
//     await redisClient.set(`gamestate:${roomId}`, JSON.stringify(gameState))
//     io.to(playerData.room).emit("setGameState", gameState)
//   })
//   socket.on("setReadyUp", async () => {
//     let playerData = JSON.parse(await redisClient.get(`username:${socket.username}`))
//     const gameState = JSON.parse(await redisClient.get(`gamestate:${playerData.room}`))
//
//     playerData = { ...playerData, ready: !playerData.ready }
//     await redisClient.set(`username:${playerData.username}`, JSON.stringify(playerData))
//     gameState.players = { ...gameState.players, [playerData.username]: playerData }
//     await redisClient.set(`gamestate:${playerData.room}`, JSON.stringify(gameState))
//     io.to(playerData.room).emit("setGameState", gameState)
//
//     const minimumRequiredPlayers = Object.keys(gameState.players).length > 1
//     const allPlayersReady = Object.values(gameState.players).every(({ ready }) => {
//       return ready
//     })
//     io.to(playerData.room).emit("setGameState", gameState)
//     if (minimumRequiredPlayers && allPlayersReady) {
//       const playerColors = ["green", "red", "yellow", "blue"]
//       Object.values(gameState.players).forEach(async (player, index) => {
//         const playerUpdates = {
//           ...player,
//           startingtokens: { gold: 3, blackmail: 1, force: 1 },
//           bids: {},
//           support: 0,
//           // influence: {},
//           color: playerColors[index]
//         }
//         gameState.players[player.username] = playerUpdates
//         await redisClient.set(`username:${player.username}`, JSON.stringify(playerUpdates))
//       })
//       gameState.phase = "bidding"
//
//       await redisClient.set(`gamestate:${playerData.room}`, JSON.stringify(gameState))
//       io.to(playerData.room).emit("setGameState", gameState)
//     }
//   })
//   socket.on("submitBids", async (bids) => {
//     let playerData = JSON.parse(await redisClient.get(`username:${socket.username}`))
//     const gameState = JSON.parse(await redisClient.get(`gamestate:${playerData.room}`))
//
//     playerData = { ...playerData, bids, startingtokens: {} }
//     await redisClient.set(`username:${playerData.username}`, JSON.stringify(playerData))
//     gameState.players = { ...gameState.players, [playerData.username]: playerData }
//     await redisClient.set(`gamestate:${playerData.room}`, JSON.stringify(gameState))
//     io.to(playerData.room).emit("setGameState", gameState)
//
//     const allBidsSubmitted = Object.values(gameState.players).every(({ bids }) => {
//       return Object.keys(bids).length
//     })
//     if (allBidsSubmitted) {
//       await resolveBids({ room: playerData.room, gameState })
//     }
//   })
//
//   const resolveBids = async ({ room, gameState }) => {
//     const highestBids = findHighestBids({ playersInGame: Object.values(gameState.players) })
//     gameState.highestbids = highestBids
//     const spacesWon = Object.entries(highestBids).reduce((result, [space, { winner }]) => {
//       if (winner) {
//         result[space] = winner
//       }
//       return result
//     }, {})
//     const playerBenefits = Object.entries(spacesWon).reduce((result, [space, player]) => {
//       const benefitsAwarded = bidBoard.find(({ id }) => {
//         return id == space
//       })?.benefits
//       if (!result[player]) {
//         result[player] = {}
//       }
//       if (benefitsAwarded) {
//         benefitsAwarded.forEach(({ benefit }) => {
//           if (benefit.includes("support")) {
//             const [_, amount] = benefit.split("-")
//             if (!result[player].support) {
//               result[player].support = 0
//             }
//             result[player].support += parseInt(amount)
//           } else if (benefit.includes("-")) {
//             const [token, amount] = benefit.split("-")
//             if (!result[player].tokenswon) {
//               result[player].tokenswon = { [token]: 0 }
//             }
//             if (!result[player].tokenswon[token]) {
//               result[player].tokenswon[token] = 0
//             }
//             result[player].tokenswon[token] += parseInt(amount)
//           } else if (benefit === "replace") {
//             result[player].replace = true
//             gameState.playerToReplace = player
//           } else if (benefit === "swap") {
//             result[player].swap = true
//             gameState.playerToSwap = player
//           } else {
//             if (!result[player].influence) {
//               result[player].influence = []
//             }
//             result[player].influence = [...result[player].influence, benefit]
//           }
//         })
//       }
//       return result
//     }, {})
//
//     for (const player of Object.values(gameState.players)) {
//       const { tokenswon = {}, support = 0, replace = false, swap = false, influence = [] } = playerBenefits[player.username]
//       const totalTokensWon = Object.values(tokenswon).reduce((result, tokenCount) => {
//         result += tokenCount
//         return result
//       }, 0)
//       const additionalGold = totalTokensWon < 5 ? 5 - totalTokensWon : 0
//       const startingTokens = { ...tokenswon }
//       if (additionalGold) {
//         startingTokens.gold = (startingTokens.gold ?? 0) + additionalGold
//       }
//       const playerUpdates = {
//         ...player,
//         startingtokens: startingTokens,
//         tokenswon,
//         additionalgold: additionalGold,
//         support: (player.support ?? 0) + support,
//         replace,
//         swap
//       }
//       gameState.players[player.username] = playerUpdates
//       await redisClient.set(`username:${player.username}`, JSON.stringify(playerUpdates))
//
//       influence.forEach((locationId) => {
//         gameState.gameboard.forEach((location) => {
//           if (location.id === locationId) {
//             location.influence = [...location.influence, player.username]
//           }
//         })
//       })
//     }
//
//     gameState.phase = gameState.playerToReplace ? "replace" : gameState.playerToSwap ? "swap" : "bidding"
//     checkForWinner()
//     await redisClient.set(`gamestate:${room}`, JSON.stringify(gameState))
//     io.to(room).emit("setGameState", gameState)
//   }
//   const checkForWinner = async () => {
//     let playerData = JSON.parse(await redisClient.get(`username:${socket.username}`))
//     const gameState = JSON.parse(await redisClient.get(`gamestate:${playerData.room}`))
//     const gameOver = gameState.gameboard.every((location) => {
//       const arrayLength = location.influence.length === location.spaces
//       const allSpacesFilled = location.influence.every((space) => {
//         return !!space
//       })
//       return arrayLength && allSpacesFilled
//     })
//     io.to(playerData.room).emit("notifyPlayers", { title: "gameOver", message: gameOver })
//   }
//
//   socket.on("replaceInfluence", async (space) => {
//     let playerData = JSON.parse(await redisClient.get(`username:${socket.username}`))
//     const gameState = JSON.parse(await redisClient.get(`gamestate:${playerData.room}`))
//     const [location, player, index] = spaceA.split("-")
//     const boardLocation = gameState.gameboard.find((loc) => {
//       return loc.id === location
//     })
//     boardLocation.influence[index] = socket.username
//     playerData = { ...playerData, replace: false }
//     gameState.playerToReplace = null
//     gameState.phase = gameState.playerToSwap ? "swap" : "bidding"
//     checkForWinner()
//     gameState.players = { ...gameState.players, [playerData.username]: playerData }
//     await redisClient.set(`username:${playerData.username}`, JSON.stringify(playerData))
//     await redisClient.set(`gamestate:${playerData.room}`, JSON.stringify(gameState))
//     io.to(playerData.room).emit("setGameState", gameState)
//   })
//   socket.on("swapInfluence", async ([spaceA, spaceB]) => {
//     console.log("selectedSpaces", spaceA)
//     console.log("selectedSpaces", spaceB)
//     let playerData = JSON.parse(await redisClient.get(`username:${socket.username}`))
//     const gameState = JSON.parse(await redisClient.get(`gamestate:${playerData.room}`))
//     const [locationA, playerA, indexA] = spaceA.split("-")
//     const [locationB, playerB, indexB] = spaceB.split("-")
//     const boardLocationA = gameState.gameboard.find((loc) => {
//       return loc.id === locationA
//     })
//     const boardLocationB = gameState.gameboard.find((loc) => {
//       return loc.id === locationB
//     })
//     boardLocationA.influence[indexA] = playerB
//     boardLocationB.influence[indexB] = playerA
//     playerData = { ...playerData, swap: false }
//     gameState.playerToSwap = null
//     gameState.phase = "bidding"
//     checkForWinner()
//     gameState.players = { ...gameState.players, [playerData.username]: playerData }
//     await redisClient.set(`username:${playerData.username}`, JSON.stringify(playerData))
//     await redisClient.set(`gamestate:${playerData.room}`, JSON.stringify(gameState))
//     io.to(playerData.room).emit("setGameState", gameState)
//   })
//   socket.on("testing", async () => {
//     checkForWinner()
//   })
//   socket.on("disconnecting", async () => {
//     console.log("disconnecting", socket.username)
//     let playerData = JSON.parse(await redisClient.get(`username:${socket.username}`))
//     if (playerData) {
//       if (playerData.room) {
//         const gameState = JSON.parse(await redisClient.get(`gamestate:${playerData.room}`))
//         if (gameState) {
//           if (gameState.phase === "lobby") {
//             delete gameState.players[playerData.username]
//             await redisClient.set(`gamestate:${playerData.room}`, JSON.stringify(gameState))
//             io.to(playerData.room).emit("setGameState", gameState)
//           } else {
//             await redisClient.set(
//               `username:${playerData.username}`,
//               JSON.stringify({ ...playerData, connected: false, room: null, rejoinroom: playerData.room })
//             )
//             gameState.players[playerData.username] = {
//               ...playerData,
//               connected: false,
//               room: null,
//               rejoinroom: playerData.room
//             }
//             await redisClient.set(`gamestate:${playerData.room}`, JSON.stringify(gameState))
//             io.to(playerData.room).emit("setGameState", gameState)
//           }
//         }
//       } else if (playerData.rejoinroom) {
//         await redisClient.set(`username:${playerData.username}`, JSON.stringify({ ...playerData, connected: false }))
//       }
//       return
//     }
//     await redisClient.set(`username:${socket.username}`, JSON.stringify({ connected: false }))
//   })
// })

server.listen(4000, () => {
  console.log("Server listening on port 4000")
})

const gameBoard = [
  { id: "plantation", name: "Plantation", spaces: 6, influence: [] },
  { id: "tavern", name: "Tavern", spaces: 4, influence: [] },
  { id: "cathedral", name: "Cathedral", spaces: 7, influence: [] },
  { id: "townhall", name: "Town Hall", spaces: 7, influence: [] },
  { id: "fortress", name: "Fortress", spaces: 8, influence: [] },
  { id: "market", name: "Market", spaces: 5, influence: [] },
  { id: "harbor", name: "Harbor", spaces: 6, influence: [] }
]

const benefits = {
  oneSupport: {
    name: "One Support",
    benefit: "support-1"
  },
  threeSupport: {
    name: "Three Support",
    benefit: "support-3"
  },
  fiveSupport: {
    name: "Five Support",
    benefit: "support-5"
  },
  sixSupport: {
    name: "Six Support",
    benefit: "support-6"
  },
  tenSupport: {
    name: "Ten Support",
    benefit: "support-10"
  },
  threeGold: {
    name: "Three Gold",
    benefit: "gold-3"
  },
  fiveGold: {
    name: "Five Gold",
    benefit: "gold-5"
  },
  oneBlackmail: {
    name: "One Blackmail",
    benefit: "blackmail-1"
  },
  twoBlackmail: {
    name: "Two Blackmail",
    benefit: "blackmail-2"
  },
  oneForce: {
    name: "One Force",
    benefit: "force-1"
  },
  fortress: {
    name: "Influence Fortress",
    benefit: "fortress"
  },
  harbor: {
    name: "Influence Harbor",
    benefit: "harbor"
  },
  tavern: {
    name: "Influence Tavern",
    benefit: "tavern"
  },
  townhall: {
    name: "Influence Town Hall",
    benefit: "townhall"
  },
  cathedral: {
    name: "Influence Cathedral",
    benefit: "cathedral"
  },
  plantation: {
    name: "Influence Plantation",
    benefit: "plantation"
  },
  market: {
    name: "Influence Market",
    benefit: "market"
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
    id: "general"
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
    benefits: [benefits.threeSupport, benefits.oneBlackmail, benefits.townhall],
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

const findHighestBids = ({ playersInGame }) => {
  return playersInGame.reduce((winningBids, player) => {
    Object.entries(player.bids).forEach(([person, bid]) => {
      const winningBid = compareBids({
        playerBid: { player: player.username, bid },
        currentWinningBid: winningBids[person]
      })
      if (winningBid && winningBid.player) {
        winningBids[person] = { winner: winningBid.player, bid: winningBid.bid }
      } else if (!winningBid) {
        if (winningBids[person]?.winner) {
          winningBids[person].tie = [winningBids[person].winner]
          delete winningBids[person].winner
        }
        winningBids[person].tie = [...winningBids[person]?.tie, player.username]
      }
    })
    return winningBids
  }, {})
}

const compareBids = ({ playerBid, currentWinningBid }) => {
  const tokenOrder = ["force", "blackmail", "gold"]
  for (const token of tokenOrder) {
    const value1 = playerBid?.bid[token] || 0
    const value2 = currentWinningBid?.bid[token] || 0
    if (value1 > value2) {
      return playerBid
    } else if (value2 > value1) {
      return currentWinningBid
    }
  }
  return null
}
