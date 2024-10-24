require("dotenv").config()
const express = require("express")
const { Server } = require("socket.io")
const helmet = require("helmet")
const cors = require("cors")
const authRouter = require("./routers/authRouter")
const session = require("express-session")
const redisClient = require("./redis")
const RedisStore = require("connect-redis").default
// const { initializeUser, addFriend, onDisconnect, authorizeUser, dm } = require("./controllers/socketController")

const app = express()
const server = require("http").createServer(app)
app.use(helmet())
app.use(express.json())
const corsObject = {
  origin: ["http://localhost:5173", `http://192.168.87.208:5173`],
  credentials: true
}
app.use(cors(corsObject))
const sessionMiddleware = session({
  secret: process.env.COOKIE_SECRET,
  credentials: true,
  name: "sid",
  store: new RedisStore({ client: redisClient }),
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === "production" ? "true" : "auto",
    httpOnly: true,
    expires: 1000 * 60 * 60 * 24 * 7,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  }
})
app.use(sessionMiddleware)
app.use("/auth", authRouter)
server.listen(4000, "0.0.0.0", () => {
  console.log("Server listening on port 4000")
})
const io = new Server(server, {
  cors: corsObject
})
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next)
})
io.use(async (socket, next) => {
  if (!socket.request.session || !socket.request.session.user) {
    console.log("Bad request!")
    next(new Error("Not authorized"))
  } else {
    console.log("Good request!")
    // const defaultPlayerInfo = { ...socket.request.session.user, socketId: socket.id }
    try {
      await redisClient.hmset(`playerInfo:${socket.request.session.user.userId}`, {
        ...socket.request.session.user,
        socketId: socket.id
      })
      next()
    } catch (e) {
      console.error("Error setting Redis hash:", e)
      next(new Error("Internal server error"))
    }
  }
})
io.on("connect", async (socket) => {
  const getPlayerInfo = (userId = socket.request.session.user.userId) => {
    return redisClient.hgetall(`playerInfo:${userId}`)
  }
  socket.emit("playerInfo", await getPlayerInfo())
  socket.on("getPlayerInfo", async () => {
    socket.emit("playerInfo", await getPlayerInfo())
  })
  const getPlayerInfoInRoom = async (room) => {
    try {
      return await Promise.all(
        (await redisClient.smembers(room)).map((userId) => {
          return redisClient.hgetall(`playerInfo:${userId}`)
        })
      )
    } catch (e) {
      console.error("Error getting users in room", e)
    }
  }
  socket.on("joinRoom", async ({ roomId }) => {
    if (roomId) {
      try {
        console.log(`Socket ${socket.id} joined room: ${roomId}`)
        const playerInfo = await getPlayerInfo()
        socket.join(roomId)
        if (playerInfo.gameId) {
          if (playerInfo.gameId === roomId) {
            const playersInGame = await redisClient.smembers(`game:${roomId}:players`)
            if (
              playersInGame.some((userId) => {
                return userId === playerInfo.userId
              })
            ) {
              //player belongs in game
              await redisClient.hmset(`playerInfo:${playerInfo.userId}`, { connected: true })
              const playersInGame = await getPlayerInfoInRoom(`game:${roomId}:players`)
              io.to(roomId).emit("playerRejoinedGame", playerInfo)
              io.to(roomId).emit("playersInGame", playersInGame)
              io.to(roomId).emit("gameState", await redisClient.get(`game:${roomId}:state`))
            }
          } else {
            throw new Error("You are already in a game and must leave that game before tying to join a new one")
          }
        } else {
          //they are joining a lobby
          await redisClient.hmset(`playerInfo:${playerInfo.userId}`, { lobbyId: roomId, isReady: false })
          await redisClient.sadd(`lobby:${roomId}:players`, playerInfo.userId)
          io.to(roomId).emit("playerJoinedLobby", playerInfo)
          const playersInLobby = await getPlayerInfoInRoom(`lobby:${roomId}:players`)
          io.to(roomId).emit("playersInLobby", playersInLobby)
        }
      } catch (e) {
        console.error("Error joining room:", e.message || e)
        socket.emit("errorJoiningRoom", {
          message: "There was an error joining the room. Please try again."
        })
      }
    }
  })
  socket.on("toggleReady", async (isReady) => {
    console.log(`Socket ${socket.id} toggled isReady: ${isReady}`)
    const playerInfo = await getPlayerInfo()
    await redisClient.hmset(`playerInfo:${playerInfo.userId}`, { isReady })
    const playersInLobby = await getPlayerInfoInRoom(`lobby:${playerInfo.lobbyId}:players`)
    io.to(playerInfo.lobbyId).emit("playersInLobby", playersInLobby)
    if (
      playersInLobby.every((user) => {
        return user.isReady === "true"
      })
    ) {
      await redisClient.set(`game:${playerInfo.lobbyId}:state`, "bidding")
      await redisClient.del(`lobby:${playerInfo.lobbyId}:players`)

      await redisClient.sadd(
        `game:${playerInfo.lobbyId}:players`,
        ...playersInLobby.map(({ userId }) => {
          return userId
        })
      )
      await Promise.all(
        playersInLobby.map(async ({ userId }) => {
          await redisClient.hmset(`playerInfo:${userId}`, { gameId: playerInfo.lobbyId, connected: true })
          await redisClient.hdel(`playerInfo:${userId}`, "lobbyId")
          await redisClient.hdel(`playerInfo:${userId}`, "isReady")
        })
      )
      io.to(playerInfo.lobbyId).emit("startGame", await getPlayerInfoInRoom(`game:${playerInfo.lobbyId}:players`))
    }
  })
  socket.on("leaveGame", async () => {
    console.log(`Socket ${socket.id} left game`)
    const playerInfo = await getPlayerInfo()
    const playersInLobby = await getPlayerInfoInRoom(`game:${playerInfo.gameId}:players`)
    await Promise.all(
      playersInLobby.map(async ({ userId }) => {
        await redisClient.hdel(`playerInfo:${userId}`, "gameId")
        await redisClient.hdel(`playerInfo:${userId}`, "connected")
      })
    )
    await redisClient.del(`game:${playerInfo.gameId}:players`)
    await redisClient.del(`game:${playerInfo.gameId}:state`)
    io.to(playerInfo.gameId).emit("endGame")
    io.to(playerInfo.gameId).emit("serverNotification", "A player has left the game and the game will be terminated")
    await Promise.all(
      playersInLobby.map(async ({ socketId, userId }) => {
        const s = io.sockets.sockets.get(socketId)
        if (s) {
          s.emit("playerInfo", await getPlayerInfo(userId))
          s.leave(playerInfo.gameId)
        }
      })
    )
  })
  const handleLeaveRoom = async ({ roomId }) => {
    if (roomId) {
      try {
        console.log(`Socket ${socket.id} left room: ${roomId}`)
        const playerInfo = await getPlayerInfo()
        socket.leave(roomId)
        if (playerInfo.lobbyId) {
          await redisClient.hmset(`playerInfo:${playerInfo.userId}`, { lobbyId: null, isReady: null })
          await redisClient.srem(`lobby:${roomId}:players`, playerInfo.userId)
          const playersInLobby = await getPlayerInfoInRoom(`lobby:${roomId}:players`)
          io.to(roomId).emit("playerLeftLobby", playerInfo)
          io.to(roomId).emit("playersInLobby", playersInLobby)
        } else if (playerInfo.gameId) {
          await redisClient.hmset(`playerInfo:${playerInfo.userId}`, { connected: false })
          const playersInGame = await getPlayerInfoInRoom(`game:${roomId}:players`)
          io.to(roomId).emit("playerDisconnectedFromGame", playerInfo)
          io.to(roomId).emit("playersInGame", playersInGame)
          io.to(roomId).emit("gameState", "pause")
        }
      } catch (e) {
        console.error("Error leaving room:", e.message || e)
        socket.emit("errorLeavingRoom", {
          message: "There was an error leaving the room. Please try again."
        })
      }
    }
  }
  socket.on("leaveRoom", async ({ roomId }) => {
    await handleLeaveRoom({ roomId })
  })
  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id)
    const playerInfo = await getPlayerInfo()
    await handleLeaveRoom({ roomId: playerInfo.lobbyId || playerInfo.gameId })
  })
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
