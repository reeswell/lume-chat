import type { UpsertConversationDto } from './dto'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(ownerId: string) {
    return this.prisma.conversation.findMany({
      where: { ownerId },
      orderBy: [{ pinned: 'desc' }, { lastMessageAt: 'desc' }, { id: 'desc' }],
    })
  }

  async upsert(ownerId: string, dto: UpsertConversationDto) {
    return this.prisma.conversation.upsert({
      where: { ownerId_roomId: { ownerId, roomId: dto.roomId } },
      create: { ownerId, ...dto },
      update: {
        title: dto.title,
        avatar: dto.avatar,
        type: dto.type,
        friendId: dto.friendId,
        groupId: dto.groupId,
        removedAt: null,
      },
    })
  }

  async touch(roomId: string, message: string, exceptOwnerId?: string) {
    await this.prisma.conversation.updateMany({
      where: { roomId, removedAt: null },
      data: { lastMessage: message, lastMessageAt: new Date() },
    })

    if (exceptOwnerId !== undefined && exceptOwnerId !== '') {
      await this.prisma.conversation.updateMany({
        where: { roomId, ownerId: { not: exceptOwnerId }, removedAt: null },
        data: { unread: { increment: 1 } },
      })
    }
  }

  async markRead(ownerId: string, roomId: string) {
    return this.prisma.conversation.updateMany({
      where: { ownerId, roomId },
      data: { unread: 0 },
    })
  }

  async remove(ownerId: string, roomId: string) {
    return this.prisma.conversation.delete({
      where: { ownerId_roomId: { ownerId, roomId } },
    })
  }
}
