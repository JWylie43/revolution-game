const express = require("express")
const { sessionMiddleware, wrap, corsConfig } = require("./controllers/serverController")
const { Server } = require("socket.io")
const app = express()
const helmet = require("helmet")
const cors = require("cors")
const authRouter = require("./routers/authRouter")
const { initializeUser, addFriend, onDisconnect, authorizeUser, dm } = require("./controllers/socketController")
const redisClient = require("./redis")
const server = require("http").createServer(app)

const io = new Server(server, {
  cors: corsConfig
})

app.use(helmet())
app.use(cors(corsConfig))
app.use(express.json())
app.use(sessionMiddleware)

app.use("/auth", authRouter)

io.use(wrap(sessionMiddleware))
io.use(authorizeUser)

const playerModel = {
  username: "",
  userid: "",
  connected: "",
  room: "",
  rejoinroom: "",
  ready: false,
  startingtokens: { gold: 3, blackmail: 1, force: 1 },
  bids: { general: { gold: 2, force: 2 } },
  support: 0,
  influence: { plantation: 1 }
}
const gameStateModel = {
  phase: "bidding",
  players: { testing: { ...playerModel } },
  round: 1,
  highestbids: {
    general: { winner: "testing", bid: { gold: 2, force: 2 } },
    captain: { tie: ["testing", "newname"], bid: { gold: 2, force: 2 } }
  }
  // bidboard: bidBoard,
  // gameboard: gameboard
}

io.on("connect", async (socket) => {
  console.log("connecting")
  const { username, userid } = socket.request.session.user
  socket.username = username
  const initializePlayer = {
    ...JSON.parse(await redisClient.get(`username:${username}`)),
    username,
    userid,
    connected: true
  }
  await redisClient.set(`username:${username}`, JSON.stringify(initializePlayer))
  socket.emit("initializePlayer", initializePlayer)

  socket.on("joinGame", async (roomId, callback) => {
    socket.rooms.forEach((room) => {
      socket.leave(room)
    })
    let playerData = JSON.parse(await redisClient.get(`username:${socket.username}`))
    if (playerData.rejoinroom && playerData.rejoinroom !== roomId) {
      callback(`#${playerData.rejoinroom}`)
      return
    }
    const gameState = JSON.parse(await redisClient.get(`gamestate:${roomId}`)) || {
      phase: "lobby",
      players: {},
      round: 1,
      highestbids: {},
      bidboard: bidBoard,
      gameboard: gameBoard
    }
    const playerInGame = gameState.players[playerData.username]
    const maximumPlayersMet = Object.keys(gameState.players).length >= 4
    if (!playerInGame && (gameState?.phase !== "lobby" || maximumPlayersMet)) {
      callback()
      return
    }
    socket.join(roomId)
    playerData = { ...playerData, room: roomId, rejoinroom: null }
    await redisClient.set(`username:${playerData.username}`, JSON.stringify(playerData))
    gameState.players = { ...gameState.players, [playerData.username]: playerData }
    await redisClient.set(`gamestate:${roomId}`, JSON.stringify(gameState))
    io.to(playerData.room).emit("setGameState", gameState)
  })
  socket.on("setReadyUp", async () => {
    let playerData = JSON.parse(await redisClient.get(`username:${socket.username}`))
    const gameState = JSON.parse(await redisClient.get(`gamestate:${playerData.room}`))

    playerData = { ...playerData, ready: !playerData.ready }
    await redisClient.set(`username:${playerData.username}`, JSON.stringify(playerData))
    gameState.players = { ...gameState.players, [playerData.username]: playerData }
    await redisClient.set(`gamestate:${playerData.room}`, JSON.stringify(gameState))
    io.to(playerData.room).emit("setGameState", gameState)

    const minimumRequiredPlayers = Object.keys(gameState.players).length > 1
    const allPlayersReady = Object.values(gameState.players).every(({ ready }) => {
      return ready
    })
    io.to(playerData.room).emit("setGameState", gameState)
    if (minimumRequiredPlayers && allPlayersReady) {
      const playerColors = ["green", "red", "yellow", "blue"]
      Object.values(gameState.players).forEach(async (player, index) => {
        const playerUpdates = {
          ...player,
          startingtokens: { gold: 3, blackmail: 1, force: 1 },
          bids: {},
          support: 0,
          influence: {},
          color: playerColors[index]
        }
        gameState.players[player.username] = playerUpdates
        await redisClient.set(`username:${player.username}`, JSON.stringify(playerUpdates))
      })
      gameState.phase = "bidding"

      await redisClient.set(`gamestate:${playerData.room}`, JSON.stringify(gameState))
      io.to(playerData.room).emit("setGameState", gameState)
    }
  })

  socket.on("submitBids", async (bids) => {
    let playerData = JSON.parse(await redisClient.get(`username:${socket.username}`))
    const gameState = JSON.parse(await redisClient.get(`gamestate:${playerData.room}`))

    playerData = { ...playerData, bids, startingtokens: {} }
    await redisClient.set(`username:${playerData.username}`, JSON.stringify(playerData))
    gameState.players = { ...gameState.players, [playerData.username]: playerData }
    await redisClient.set(`gamestate:${playerData.room}`, JSON.stringify(gameState))
    io.to(playerData.room).emit("setGameState", gameState)

    const allBidsSubmitted = Object.values(gameState.players).every(({ bids }) => {
      return Object.keys(bids).length
    })
    if (allBidsSubmitted) {
      const bidResults = compareAllBids({ playersInGame: Object.values(gameState.players) })
      await test({ playerData, gameState, bidResults })
    }
  })
  socket.on("testing", async () => {
    let playerData = JSON.parse(await redisClient.get(`username:${socket.username}`))
    const gameState = JSON.parse(await redisClient.get(`gamestate:${playerData.room}`))
    const bidResults = compareAllBids({ playersInGame: Object.values(gameState.players) })
    console.log("bidResults", bidResults)
    await test({ playerData, gameState, bidResults })
  })

  const test = async ({ playerData, gameState, bidResults }) => {
    const spacesWon = Object.entries(bidResults)
      .filter(([person, values]) => {
        return values.winner
      })
      .map(([person, values]) => {
        return { person, player: values.winner }
      })
    const biddingResults = Object.keys(gameState.players).reduce((result, current) => {
      result[current] = {}
      return result
    }, {})

    spacesWon.forEach((spaces) => {
      const { player } = spaces
      const benefitsAwarded = bidBoard.find((person) => {
        return person.id == spaces.person
      })?.benefits
      benefitsAwarded.forEach(({ benefit }) => {
        if (benefit.includes("support")) {
          const [_, amount] = benefit.split("-")
          if (!biddingResults[player].support) {
            biddingResults[player].support = 0
          }
          biddingResults[player].support += parseInt(amount)
        } else if (benefit.includes("-")) {
          const [token, amount] = benefit.split("-")
          if (!biddingResults[player].tokenswon) {
            biddingResults[player].tokenswon = { [token]: 0 }
          }
          if (!biddingResults[player].tokenswon[token]) {
            biddingResults[player].tokenswon[token] = 0
          }
          biddingResults[player].tokenswon[token] += parseInt(amount)
        } else if (benefit === "replace") {
          biddingResults[player].replace = true
        } else if (benefit === "swap") {
          biddingResults[player].swap = true
        } else {
          if (!biddingResults[player].influence) {
            biddingResults[player].influence = []
          }
          biddingResults[player].influence = [...biddingResults[player].influence, benefit]
        }
      })
    })
    console.log("biddingResults", biddingResults)
    let gameBoardCopy = [...gameState.gameboard]
    for (const player of Object.values(gameState.players)) {
      console.log("test", biddingResults[player.username])

      const { tokenswon = {}, support = 0, replace = false, swap = false, influence = [] } = biddingResults[player.username]

      const totalTokensWon = Object.values(tokenswon).reduce((result, current) => {
        result += current
        return result
      }, 0)
      const additionalGold = totalTokensWon < 5 ? 5 - totalTokensWon : 0
      const startingTokens = { ...tokenswon }
      console.log("additionalGold", additionalGold)
      console.log("startingTokens", startingTokens)
      if (additionalGold) {
        if (startingTokens.gold) {
          startingTokens.gold += additionalGold
        } else {
          startingTokens.gold = additionalGold
        }
      }
      console.log("startingTokens", startingTokens)
      const playerUpdates = {
        ...player,
        startingtokens: startingTokens,
        tokenswon,
        additionalgold: additionalGold,
        support: player.support + support,
        replace,
        swap
      }
      gameState.players[player.username] = playerUpdates
      await redisClient.set(`username:${player.username}`, JSON.stringify(playerUpdates))

      console.log("influence", influence)

      influence.forEach((locationId) => {
        gameBoardCopy.forEach((location) => {
          if (location.id === locationId) {
            location.influence = [...location.influence, player.username]
          }
        })
      })
    }
    console.log("gameBoardCopy", gameBoardCopy)
    gameState.gameboard = [...gameBoardCopy]
    gameState.phase = "replace"
    await redisClient.set(`gamestate:${playerData.room}`, JSON.stringify(gameState))
    io.to(playerData.room).emit("setGameState", gameState)
  }

  socket.on("disconnecting", async () => {
    console.log("disconnecting", socket.username)
    let playerData = JSON.parse(await redisClient.get(`username:${socket.username}`))
    if (playerData) {
      if (playerData.room || playerData?.rejoinroom) {
        const gameState = JSON.parse(await redisClient.get(`gamestate:${playerData.room}`))
        if (gameState) {
          if (gameState.phase === "lobby") {
            delete gameState.players[playerData.username]
            await redisClient.set(`gamestate:${playerData.room}`, JSON.stringify(gameState))
            io.to(playerData.room).emit("setGameState", gameState)
          } else {
            await redisClient.set(
              `username:${playerData.username}`,
              JSON.stringify({ ...playerData, connected: false, room: null, rejoinroom: playerData.room })
            )
            gameState.players[playerData.username] = {
              ...playerData,
              connected: false,
              room: null,
              rejoinroom: playerData.room
            }
            await redisClient.set(`gamestate:${playerData.room}`, JSON.stringify(gameState))
            io.to(playerData.room).emit("setGameState", gameState)
            return
          }
        }
      } else if (playerData.rejoinroom) {
        await redisClient.set(`username:${playerData.username}`, JSON.stringify({ ...playerData, connected: false }))
      }
    }
    await redisClient.set(`username:${socket.username}`, JSON.stringify({ connected: false }))
  })
})

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

const compareAllBids = ({ playersInGame }) => {
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
