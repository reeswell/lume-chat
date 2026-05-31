import type { FriendRequestDto } from './dto'
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { friendRoomId, publicUserSelect } from '../common/selects'
import { ConversationsService } from '../conversations/conversations.service'
import { PrismaService } from '../prisma/prisma.service'
import { RealtimeService } from '../realtime/realtime.service'

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversations: ConversationsService,
    private readonly realtime: RealtimeService,
  ) {}

  async list(userId: string) {
    const rows = await this.prisma.friend.findMany({
      where: { selfId: userId },
      include: { other: { select: publicUserSelect() } },
      orderBy: { createDate: 'desc' },
    })
    return rows.map(row => ({
      id: row.other.id,
      roomId: row.roomId,
      friend: row.other,
      createDate: row.createDate,
    }))
  }

  async check(userId: string, otherId: string) {
    const row = await this.prisma.friend.findUnique({
      where: { selfId_otherId: { selfId: userId, otherId } },
    })
    return { isFriend: Boolean(row), roomId: row?.roomId ?? null }
  }

  async request(userId: string, dto: FriendRequestDto) {
    if (userId === dto.targetUserId)
      throw new ConflictException('Cannot add yourself')
    const isFriend = await this.check(userId, dto.targetUserId)
    if (isFriend.isFriend)
      throw new ConflictException('Already friends')

    const [sender, target, official] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect() }),
      this.prisma.user.findUnique({ where: { id: dto.targetUserId }, select: publicUserSelect() }),
      this.prisma.user.findUnique({ where: { userName: 'vueChat' }, select: publicUserSelect() }),
    ])
    if (!sender || !target || !official)
      throw new NotFoundException('User not found')

    const roomId = friendRoomId(target.id, official.id)
    await this.conversations.upsert(target.id, {
      roomId,
      title: official.nickname,
      avatar: official.avatar,
      type: 'system',
      friendId: official.id,
    })

    const trimmedMessage = dto.message?.trim() ?? ''
    const requestContent = trimmedMessage !== ''
      ? trimmedMessage
      : `我是 ${sender.nickname !== '' ? sender.nickname : sender.userName}`
    const message = await this.prisma.message.create({
      data: {
        roomId,
        senderId: sender.id,
        userName: sender.userName,
        nickname: sender.nickname,
        avatar: sender.avatar,
        content: requestContent,
        style: 'validate',
        type: 'validate',
        state: 'friend',
        status: '0',
        targetUserId: target.id,
        friendRoom: friendRoomId(sender.id, target.id),
      },
    })

    await this.conversations.touch(roomId, message.content, sender.id)
    this.realtime.emitToRoom(roomId, 'mes', message)
    this.realtime.emitToRoom(roomId, 'takeValidate', message)
    this.realtime.emitToUser(target.id, 'takeValidate', message)

    return message
  }

  async accept(userId: string, requesterId: string) {
    if (userId === requesterId)
      throw new ConflictException('Cannot add yourself')
    const [me, requester] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect() }),
      this.prisma.user.findUnique({ where: { id: requesterId }, select: publicUserSelect() }),
    ])
    if (!me || !requester)
      throw new NotFoundException('User not found')

    const roomId = friendRoomId(userId, requesterId)
    await this.prisma.$transaction([
      this.prisma.friend.upsert({
        where: { selfId_otherId: { selfId: userId, otherId: requesterId } },
        create: { selfId: userId, otherId: requesterId, roomId },
        update: {},
      }),
      this.prisma.friend.upsert({
        where: { selfId_otherId: { selfId: requesterId, otherId: userId } },
        create: { selfId: requesterId, otherId: userId, roomId },
        update: {},
      }),
      this.prisma.message.updateMany({
        where: { senderId: requesterId, targetUserId: userId, type: 'validate', state: 'friend' },
        data: { status: '1' },
      }),
    ])

    await Promise.all([
      this.conversations.upsert(userId, {
        roomId,
        title: requester.nickname,
        avatar: requester.avatar,
        type: 'friend',
        friendId: requester.id,
      }),
      this.conversations.upsert(requesterId, {
        roomId,
        title: me.nickname,
        avatar: me.avatar,
        type: 'friend',
        friendId: me.id,
      }),
    ])

    const payload = { roomId, userId, requesterId }
    this.realtime.emitToUser(userId, 'friendAccepted', payload)
    this.realtime.emitToUser(requesterId, 'friendAccepted', payload)

    return { roomId }
  }

  async remove(userId: string, otherId: string) {
    const roomId = friendRoomId(userId, otherId)
    await this.prisma.$transaction([
      this.prisma.friend.deleteMany({ where: { OR: [{ selfId: userId, otherId }, { selfId: otherId, otherId: userId }] } }),
      this.prisma.conversation.deleteMany({ where: { roomId } }),
    ])
    const payload = { roomId, userId, otherId }
    this.realtime.emitToUser(userId, 'friendRemoved', payload)
    this.realtime.emitToUser(otherId, 'friendRemoved', payload)
    return { ok: true }
  }
}
