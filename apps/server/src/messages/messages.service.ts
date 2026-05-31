import type { SocketMessageDto } from './dto'
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { ConversationsService } from '../conversations/conversations.service'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversations: ConversationsService,
  ) {}

  async save(dto: SocketMessageDto) {
    const sender = dto.senderId !== undefined && dto.senderId !== ''
      ? await this.prisma.user.findUnique({ where: { id: dto.senderId } })
      : null

    if (dto.senderId !== undefined && dto.senderId !== '' && sender === null)
      throw new NotFoundException('Sender not found')
    if (sender !== null)
      await this.getRoomAccess(sender.id, dto.roomId, 'write')

    const message = await this.prisma.message.create({
      data: {
        roomId: dto.roomId,
        senderId: sender?.id,
        userName: sender?.userName ?? dto.userName ?? '',
        nickname: sender?.nickname ?? dto.nickname ?? '',
        avatar: sender?.avatar ?? dto.avatar ?? '',
        content: dto.content,
        style: dto.style ?? 'mess',
        type: dto.type ?? 'message',
      },
    })

    await this.conversations.touch(dto.roomId, dto.content, sender?.id)
    return message
  }

  async history(roomId: string, options: { cursor?: string, limit?: number, userId?: string }) {
    const access = await this.getRoomAccess(options.userId, roomId, 'read')
    const take = Math.min(Math.max(options.limit ?? 50, 1), 100)
    const rows = await this.prisma.message.findMany({
      where: this.messageWhere(roomId, access),
      take,
      ...(options.cursor !== undefined && options.cursor !== ''
        ? {
            skip: 1,
            cursor: { id: options.cursor },
          }
        : {}),
      orderBy: { createdAt: 'desc' },
      include: { reads: true },
    })

    return rows.reverse()
  }

  async search(roomId: string, userId: string, q: string) {
    const access = await this.getRoomAccess(userId, roomId, 'read')
    const keyword = q.trim()
    if (!keyword)
      return []

    return this.prisma.message.findMany({
      where: {
        ...this.messageWhere(roomId, access),
        content: { contains: keyword },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    })
  }

  async markRead(roomId: string, userId: string) {
    const access = await this.getRoomAccess(userId, roomId, 'read')
    const messages = await this.prisma.message.findMany({
      where: { ...this.messageWhere(roomId, access), reads: { none: { userId } } },
      select: { id: true },
    })

    if (messages.length) {
      await this.prisma.messageRead.createMany({
        data: messages.map(message => ({ messageId: message.id, userId })),
      })
    }

    await this.conversations.markRead(userId, roomId)
    return { ok: true }
  }

  private async getRoomAccess(userId: string | undefined, roomId: string, mode: 'read' | 'write') {
    if (userId === undefined || userId === '')
      throw new ForbiddenException('Authentication required')

    const group = await this.prisma.chatGroup.findUnique({ where: { id: roomId } })
    if (group) {
      const member = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: roomId, userId } },
      })
      if (!member) {
        const conversation = await this.prisma.conversation.findUnique({
          where: { ownerId_roomId: { ownerId: userId, roomId } },
        })
        if (mode !== 'read' || !conversation?.removedAt) {
          throw new ForbiddenException('You are not in this group')
        }
        return { removedAt: conversation.removedAt, userId }
      }
      if (mode === 'write' && group.type === 'channel' && group.holderId !== userId) {
        throw new ForbiddenException('Only group owner can send messages in this channel')
      }
      return { userId }
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { ownerId_roomId: { ownerId: userId, roomId } },
    })
    if (!conversation)
      throw new ForbiddenException('Conversation not available')
    return { userId }
  }

  private messageWhere(roomId: string, access: { removedAt?: Date, userId: string }) {
    return {
      roomId,
      ...(access.removedAt
        ? {
            createdAt: { lte: access.removedAt },
            OR: [
              { targetUserId: null },
              { targetUserId: { not: access.userId } },
            ],
          }
        : {}),
    }
  }
}
