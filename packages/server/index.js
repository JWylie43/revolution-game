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
  const setPlayersInRoom = async ({ roomId }) => {
    if (!roomId) {
      return null
    }
    const playersInRoom = await Promise.all(
      JSON.parse(await redisClient.get(`gamestate:${roomId}`))?.players.map(async (key) => {
        return JSON.parse(await redisClient.get(`username:${key}`))
      })
    )
    io.to(roomId).emit("setPlayersInRoom", playersInRoom)
    return playersInRoom
  }
  const updateRedisUser = async ({ userUpdates }) => {
    const userData = JSON.parse(
      await redisClient.get(`username:${socket.user ? socket.user.username : userUpdates.username}`)
    )
    await redisClient.set(
      `username:${socket.user ? socket.user.username : userUpdates.username}`,
      JSON.stringify({ ...userData, ...userUpdates })
    )
    socket.user = { ...userData, ...userUpdates }
    socket.emit("updateSocketUser", socket.user)
  }
  const updateGameState = async ({ updates, removePlayer, addPlayer }) => {
    const gameState = JSON.parse(await redisClient.get(`gamestate:${socket.user.room}`)) || { players: [] }
    if (removePlayer && gameState.players.includes(removePlayer)) {
      gameState.players = gameState.players.filter((player) => {
        return player !== removePlayer
      })
    }
    if (addPlayer && !gameState.players.includes(addPlayer)) {
      gameState.players = [...gameState.players, addPlayer]
    }
    await redisClient.set(`gamestate:${socket.user.room}`, JSON.stringify({ ...gameState, ...updates }))
    io.to(socket.user.room).emit("setGameState", { ...gameState, ...updates })
  }

  const { username, userid } = socket.request.session.user
  await updateRedisUser({ userUpdates: { username, userid, connected: true } })
  if (socket.user.room) {
    socket.join(socket.user.room)
    await updateGameState({ updates: {} })
    await setPlayersInRoom({ roomId: socket.user.room })
  }

  socket.on("joinGame", async (roomId, callback) => {
    socket.rooms.forEach((room) => {
      socket.leave(room)
    })
    if (socket.user.rejoinroom) {
      const rejoinRoom = socket.user.rejoinroom
      await updateRedisUser({ userUpdates: { ready: false, rejoinroom: null } })
      callback(`#${rejoinRoom}`)
      return
    }
    const gameState = JSON.parse(await redisClient.get(`gamestate:${roomId}`))
    const playerRejoining = gameState?.players && gameState.players.includes(socket.user.username)
    const maximumPlayersMet = gameState?.players?.length >= 4
    if (!playerRejoining && (gameState?.phase || maximumPlayersMet)) {
      callback()
      return
    }
    socket.join(roomId)
    await updateRedisUser({ userUpdates: { ready: false, room: roomId } })
    await updateGameState({ addPlayer: socket.user.username })
    await setPlayersInRoom({ roomId })
  })

  socket.on("setReadyUp", async () => {
    await updateRedisUser({ userUpdates: { ready: !socket.user.ready } })
    const playersInRoom = await setPlayersInRoom({ roomId: socket.user.room })
    if (
      playersInRoom.length > 1 &&
      playersInRoom.every((player) => {
        return player.ready === true
      })
    ) {
      await updateGameState({
        updates: {
          phase: "bidding",
          players: playersInRoom.map((player) => {
            return player.username
          })
        }
      })
    }
  })
  socket.on("leftGame", async () => {
    const room = socket.user.room
    await updateRedisUser({ userUpdates: { room: null, ready: false, bids: null, rejoinroom: room } })
    await setPlayersInRoom({ roomId: room })
    socket.leave(room)
  })
  socket.on("submitBids", async (bids) => {
    await updateRedisUser({ userUpdates: { bids: bids } })
    const playersInRoom = await setPlayersInRoom({ roomId: socket.user.room })
    if (
      playersInRoom.every((player) => {
        return player.bids
      })
    ) {
      const winningBids = calculateWinningBids({ playersInRoom })
      await updateGameState({ updates: { phase: "compareBids", winningBids } })
    }
  })

  socket.on("disconnecting", async () => {
    console.log("disconnecting", socket.user)
    const userUpdates = { connected: false }
    if (socket.user.room) {
      const gameState = JSON.parse(await redisClient.get(`gamestate:${socket.user.room}`))
      if (!gameState?.phase) {
        userUpdates.room = null
        userUpdates.ready = false
        await updateGameState({ removePlayer: socket.user.username })
      }
    }
    await setPlayersInRoom({ roomId: socket.user.room })
    await updateRedisUser({ userUpdates })
  })
})

server.listen(4000, () => {
  console.log("Server listening on port 4000")
})

const calculateWinningBids = ({ playersInRoom }) => {
  return playersInRoom.reduce((winningBids, player) => {
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
