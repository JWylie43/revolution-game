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
io.on("connect", (socket) => {
  socket.user = { ...socket.request.session.user }
  socket.join("homeroom")

  socket.on("createRoom", async ({ roomId }, callback) => {
    socket.leave("homeroom")
    await redisClient.lpush(`allgamerooms`, roomId)
    socket.join(roomId)
    io.to(roomId).emit("joinedRoom", roomId)
  })
  socket.on("disconnecting", () => onDisconnect(socket))
})

server.listen(4000, () => {
  console.log("Server listening on port 4000")
})
