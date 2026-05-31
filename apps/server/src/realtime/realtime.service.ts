import type { Server } from 'socket.io'
import { Injectable } from '@nestjs/common'

@Injectable()
export class RealtimeService {
  private server?: Server

  bind(server: Server) {
    this.server = server
  }

  emitToRoom(roomId: string, event: string, payload: unknown) {
    this.server?.to(roomId).emit(event, payload)
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(this.userRoom(userId)).emit(event, payload)
  }

  removeUserFromRoom(userId: string, roomId: string) {
    this.server?.in(this.userRoom(userId)).socketsLeave(roomId)
  }

  userRoom(userId: string) {
    return `user:${userId}`
  }
}
