const redisClient = require("../../redis")
const parseFriendList = require("./parseFriendList")

const onDisconnect = async (socket) => {
  console.log("disconnecting", socket.rooms)
  console.log("disconnecting", socket.user)
  await redisClient.hmset(`username:${socket.user.username}`, ["connected", false])
  await redisClient.srem(`roommembers:${socket.user.room}`, socket.user.username)
  // const friendList = await redisClient.lrange(`friends:${socket.user.username}`, 0, -1)
  // const friendRooms = await parseFriendList(friendList).then((friends) => friends.map((friend) => friend.userid))
  socket.to(socket.user.room).emit("playerdisconnected", socket.user.username)
}

module.exports = onDisconnect
