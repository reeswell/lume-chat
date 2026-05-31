import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: false,
    })
  }
  return socket
}

export function disconnectSocket() {
  if (!socket)
    return
  socket.removeAllListeners()
  socket.disconnect()
}
