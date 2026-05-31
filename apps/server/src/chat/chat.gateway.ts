import type {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets'
import type { Server, Socket } from 'socket.io'
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { MessagesService } from '../messages/messages.service'
import { RealtimeService } from '../realtime/realtime.service'
import { RedisService } from '../redis/redis.service'

interface ChatSocketData {
  userName?: string
  userId?: string
}

interface JoinPayload {
  roomId: string
  userName: string
}

interface JoinUserPayload {
  userId: string
  userName: string
}

interface SocketMessagePayload {
  roomId: string
  content: string
  senderId?: string
  userName?: string
  nickname?: string
  avatar?: string
  style?: string
}

@WebSocketGateway({
  transports: ['websocket'],
  cors: {
    // eslint-disable-next-line node/prefer-global/process
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server

  constructor(
    private readonly messages: MessagesService,
    private readonly redis: RedisService,
    private readonly realtime: RealtimeService,
  ) {}

  afterInit(server: Server) {
    this.realtime.bind(server)
  }

  handleConnection(socket: Socket) {
    socket.emit('customEmit', { socketId: socket.id })
  }

  async handleDisconnect(socket: Socket) {
    const { userName } = socket.data as ChatSocketData
    if (userName !== undefined && userName !== '')
      await this.redis.forgetOnline(userName, socket.id)
    this.server.emit('leaved', await this.redis.listOnline())
  }

  @SubscribeMessage('join')
  async join(@MessageBody() payload: JoinPayload, @ConnectedSocket() socket: Socket) {
    void socket.join(payload.roomId)
    const data = socket.data as ChatSocketData
    data.userName = payload.userName
    await this.redis.rememberOnline(payload.userName, socket.id)
    this.server.to(payload.roomId).emit('joined', await this.redis.listOnline())
  }

  @SubscribeMessage('joinUser')
  async joinUser(@MessageBody() payload: JoinUserPayload, @ConnectedSocket() socket: Socket) {
    void socket.join(this.realtime.userRoom(payload.userId))
    const data = socket.data as ChatSocketData
    data.userId = payload.userId
    data.userName = payload.userName
    await this.redis.rememberOnline(payload.userName, socket.id)
  }

  @SubscribeMessage('leave')
  async leave(@MessageBody() payload: JoinPayload, @ConnectedSocket() socket: Socket) {
    void socket.leave(payload.roomId)
    await this.redis.forgetOnline(payload.userName, socket.id)
    this.server.to(payload.roomId).emit('leaved', await this.redis.listOnline())
  }

  @SubscribeMessage('update')
  update(@MessageBody() roomIds: string[], @ConnectedSocket() socket: Socket) {
    for (const roomId of roomIds) socket.to(roomId).emit('update', 'update')
  }

  @SubscribeMessage('mes')
  async message(@MessageBody() payload: SocketMessagePayload, @ConnectedSocket() socket: Socket) {
    const message = await this.messages.save(payload)
    socket.to(payload.roomId).emit('mes', message)
    socket.emit('mes:sent', message)
  }

  @SubscribeMessage('getHisMeg')
  async history(@MessageBody() payload: { roomId: string, cursor?: string, limit?: number }, @ConnectedSocket() socket: Socket) {
    const { userId } = socket.data as ChatSocketData
    const messages = await this.messages.history(payload.roomId, {
      cursor: payload.cursor,
      limit: payload.limit,
      userId,
    })
    socket.emit('getHisMeg', messages)
  }

  @SubscribeMessage('setReadStatus')
  async markRead(@MessageBody() payload: { roomId: string }, @ConnectedSocket() socket: Socket) {
    const { userId } = socket.data as ChatSocketData
    if (userId !== undefined && userId !== '')
      await this.messages.markRead(payload.roomId, userId)
  }
}
