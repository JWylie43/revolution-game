import { io } from "socket.io-client"

export const socket = new io("http://192.168.1.118:4000", {
  autoConnect: false,
  withCredentials: true
})
