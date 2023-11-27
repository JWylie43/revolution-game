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
    const playersInRoom = await Promise.all(
      (await redisClient.smembers(`gameplayers:${roomId}`)).map((key) => {
        return redisClient.hgetall(`username:${key}`)
      })
    )
    io.to(roomId).emit("setPlayersInRoom", playersInRoom)
    return playersInRoom
  }
  const { username, userid } = socket.request.session.user
  await redisClient.hmset(`username:${username}`, ["username", username, "userid", userid, "connected", true])
  socket.user = await redisClient.hgetall(`username:${username}`)
  socket.emit("updateSocketUser", socket.user)
  const gameState = await redisClient.hget(`gamestate:${socket.user.room}`, "state")
  socket.emit("setGameState", gameState)
  setPlayersInRoom({ roomId: socket.user.room })

  socket.on("joinGame", async (roomId, callback) => {
    console.log("joining")
    socket.rooms.forEach((room) => {
      socket.leave(room)
    })
    const gameInProgress = await redisClient.hget(`gamestate:${roomId}`, "state")
    const maximumPlayersMet = (await redisClient.smembers(`gameplayers:${roomId}`)).length >= 4
    if (gameInProgress || maximumPlayersMet) {
      callback()
      return
    }
    socket.join(roomId)
    await redisClient.sadd(`gameplayers:${roomId}`, socket.user.username)
    await redisClient.hmset(`username:${socket.user.username}`, ["isReady", false, "room", roomId])
    socket.user = await redisClient.hgetall(`username:${socket.user.username}`)
    socket.emit("updateSocketUser", socket.user)
    await setPlayersInRoom({ roomId })
  })

  socket.on("rejoinGame", async (roomId) => {
    socket.rooms.forEach((room) => {
      socket.leave(room)
    })
    socket.join(roomId)
    await redisClient.hmset(`username:${socket.user.username}`, ["room", roomId])
    await redisClient.hdel(`username:${socket.user.username}`, "rejoinGame")
    socket.user = await redisClient.hgetall(`username:${socket.user.username}`)
    socket.emit("updateSocketUser", socket.user)
    await setPlayersInRoom({ roomId })
    const gameState = await redisClient.hget(`gamestate:${socket.user.room}`, "state")
    socket.emit("setGameState", gameState)
  })

  socket.on("setReadyUp", async (callback) => {
    await redisClient.hmset(`username:${socket.user.username}`, ["isReady", !(socket.user.isReady === "true")])
    socket.user = await redisClient.hgetall(`username:${socket.user.username}`)
    socket.emit("updateSocketUser", socket.user)
    const playersInRoom = await setPlayersInRoom({ roomId: socket.user.room })
    if (
      // playersInRoom.length > 1 &&
      playersInRoom.every((player) => {
        return player.isReady === "true" || player.isReady === true
      })
    ) {
      await redisClient.hmset(`gamestate:${socket.user.room}`, ["state", "bidding"])
      io.to(socket.user.room).emit("setGameState", "bidding")
    }
  })
  socket.on("leaveGame", async () => {
    const room = socket.user.room
    await redisClient.hdel(`username:${socket.user.username}`, "room", "isReady", "submittedBids")
    await redisClient.hmset(`username:${socket.user.username}`, ["rejoinGame", room])
    socket.user = await redisClient.hgetall(`username:${socket.user.username}`)
    socket.emit("updateSocketUser", socket.user)
    await setPlayersInRoom({ roomId: room })
    socket.leave(room)
  })
  socket.on("submitBids", async () => {
    await redisClient.hmset(`username:${socket.user.username}`, ["submittedBids", true])
    socket.user = await redisClient.hgetall(`username:${socket.user.username}`)
    socket.emit("updateSocketUser", socket.user)
    const playersInRoom = await setPlayersInRoom({ roomId: socket.user.room })
    if (
      playersInRoom.every((player) => {
        return player.submittedBids === "true" || player.submittedBids === true
      })
    ) {
      await redisClient.hmset(`gamestate:${socket.user.room}`, ["state", "compareBids"])
      io.to(socket.user.room).emit("setGameState", "compareBids")
    }
  })

  socket.on("disconnecting", async () => {
    console.log("disconnecting", socket.user)
    await redisClient.hmset(`username:${socket.user.username}`, ["connected", false])
    if (socket.user.room) {
      const gameState = await redisClient.hget(`gamestate:${socket.user.room}`, "state")
      if (gameState) {
        return
      }
      await redisClient.hdel(`username:${socket.user.username}`, "room", "isReady")
      await redisClient.srem(`gameplayers:${socket.user.room}`, socket.user.username)
    }
    await setPlayersInRoom({ roomId: socket.user.room })
  })
})

server.listen(4000, () => {
  console.log("Server listening on port 4000")
})
