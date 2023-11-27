import { io } from "socket.io-client"
import { ipaddress } from "@revolution-game/common"

export const socket = new io(`http://${ipaddress}:4000`, {
  autoConnect: false,
  withCredentials: true
})
