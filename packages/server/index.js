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

io.on("connect", async (socket) => {
  console.log("connecting")
  const getPlayersInGame = async () => {
    return await Promise.all(
      JSON.parse(await redisClient.get(`gamestate:${socket.user.room}`))?.players.map(async (key) => {
        return JSON.parse(await redisClient.get(`username:${key}`))
      })
    )
  }
  const updateRedisUser = async ({ userUpdates, overwriteUser = false }) => {
    const userData = JSON.parse(
      await redisClient.get(`username:${socket.user ? socket.user.username : userUpdates.username}`)
    )
    if (overwriteUser === true) {
      console.log("overwriteUser")
      await redisClient.set(`username:${socket.user.username}`, JSON.stringify(userUpdates))
    } else {
      await redisClient.set(
        `username:${socket.user ? socket.user.username : userUpdates.username}`,
        JSON.stringify({ ...userData, ...userUpdates })
      )
    }
    socket.user = JSON.parse(await redisClient.get(`username:${socket.user ? socket.user.username : userUpdates.username}`))
    socket.emit("updateSocketUser", socket.user)
  }
  const updateGameState = async ({ updates, removePlayer, addPlayer, addInfluence }) => {
    const targetRoom = socket.user.room || socket.user.rejoinroom
    const gameState = JSON.parse(await redisClient.get(`gamestate:${targetRoom}`)) || { phase: "lobby", players: [] }
    if (removePlayer && gameState.players.includes(removePlayer)) {
      gameState.players = gameState.players.filter((player) => {
        return player !== removePlayer
      })
    }
    if (addPlayer && !gameState.players.includes(addPlayer)) {
      gameState.players = [...gameState.players, addPlayer]
    }
    if (addInfluence) {
      console.log("gameState before", gameState.gameBoard)
      gameState.gameBoard.forEach((location) => {
        if (addInfluence[location.id]) {
          location.influence = [...location.influence, addInfluence[location.id]]
        }
      })
      console.log("gameState after", gameState.gameBoard)
      // if (!gameState.influence) {
      //   gameState.influence = {}
      // }
      // Object.entries(addInfluence).forEach(([location, player]) => {
      //   if (!gameState.influence[location]) {
      //     gameState.influence[location] = []
      //   }
      //   gameState.influence[location] = [...gameState.influence[location], player]
      // })
    }
    await redisClient.set(`gamestate:${targetRoom}`, JSON.stringify({ ...gameState, ...updates }))
    console.log("targetRoom", targetRoom)
    const playersInRoom = await Promise.all(
      JSON.parse(await redisClient.get(`gamestate:${targetRoom}`))?.players.map(async (key) => {
        return JSON.parse(await redisClient.get(`username:${key}`))
      })
    )
    io.to(targetRoom).emit("setGameState", { ...gameState, ...updates, players: playersInRoom })
  }

  const { username, userid } = socket.request.session.user
  await updateRedisUser({ userUpdates: { username, userid, connected: true } })
  if (socket.user.room) {
    socket.join(socket.user.room)
    await updateGameState({})
  }

  socket.on("joinGame", async (roomId, callback) => {
    socket.rooms.forEach((room) => {
      socket.leave(room)
    })
    if (socket.user.rejoinroom && socket.user.rejoinroom !== roomId) {
      callback(`#${socket.user.rejoinroom}`)
      return
    }
    const gameState = JSON.parse(await redisClient.get(`gamestate:${roomId}`))
    const playerRejoining = gameState?.players && gameState.players.includes(socket.user.username)
    const maximumPlayersMet = gameState?.players?.length >= 4
    if (gameState && !playerRejoining && (gameState?.phase !== "lobby" || maximumPlayersMet)) {
      callback()
      return
    }
    socket.join(roomId)
    await updateRedisUser({ userUpdates: { ready: false, room: roomId, rejoinroom: null } })
    await updateGameState({ addPlayer: socket.user.username })
  })
  socket.on("setReadyUp", async () => {
    await updateRedisUser({ userUpdates: { ready: !socket.user.ready } })
    const playersInGame = await getPlayersInGame()
    if (
      playersInGame.length > 1 &&
      playersInGame.every((player) => {
        return player.ready === true
      })
    ) {
      await updateRedisUser({ userUpdates: { startingTokens: { gold: 3, blackmail: 1, force: 1 } } })
      await updateGameState({
        updates: {
          phase: "bidding",
          gameBoard,
          bidBoard
        }
      })

      return
    }
    await updateGameState({})
  })
  socket.on("submitBids", async (bids) => {
    await updateRedisUser({ userUpdates: { bids: bids } })
    await updateGameState({})
    const playersInGame = await getPlayersInGame()
    if (
      playersInGame.every((player) => {
        return player.bids
      })
    ) {
      const bidResults = compareAllBids({ playersInGame })
      const winningBids = Object.entries(bidResults).reduce((result, [location, values]) => {
        result[location] = values.winner
        return result
      }, {})
      console.log("winningBids", winningBids)

      await updateGameState({ updates: { phase: "compareBids", bidResults } })
    }
  })
  socket.on("testing", async (bidResults) => {
    const spacesWon = Object.entries(bidResults)
      .filter(([person, values]) => {
        return values.winner
      })
      .map(([person, values]) => {
        return { person, player: values.winner }
      })
    console.log("spacesWon", spacesWon)
    const userUpdates = {}
    const gameUpdates = {}
    spacesWon.forEach((spaces) => {
      const { player } = spaces
      userUpdates[player] = {}
      const benefitsAwarded = bidBoard.find((person) => {
        return person.id == spaces.person
      })?.benefits
      // console.log("benefitsAwarded", benefitsAwarded)
      benefitsAwarded.forEach(({ benefit }) => {
        if (benefit.includes("support")) {
          const [_, amount] = benefit.split("-")
          console.log(`add support | ${player} | ${amount}`)
          userUpdates[player].support += amount
        } else if (benefit.includes("-")) {
          const [token, amount] = benefit.split("-")
          console.log(`add ${amount} ${token} | ${player}`)
          userUpdates[player].startingTokens[token] += amount
        } else if (benefit === "replace") {
          console.log(`replace cube | ${player}`)
        } else if (benefit === "swap") {
          console.log(`swap cube | ${player}`)
        } else {
          console.log(`add influence | ${player} | ${benefit}`)
        }
      })
    })
  })
  socket.on("disconnecting", async () => {
    console.log("disconnecting", socket.user)
    const gameState = JSON.parse(await redisClient.get(`gamestate:${socket.user.room}`))
    if (gameState) {
      if (gameState.phase === "lobby") {
        await updateGameState({ removePlayer: socket.user.username })
        await updateRedisUser({ userUpdates: { connected: false }, overwriteUser: true })
        return
      }
      await updateRedisUser({ userUpdates: { connected: false, room: null, rejoinroom: socket.user.room } })
      await updateGameState({})
    }
    await updateRedisUser({ userUpdates: { connected: false } })
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
