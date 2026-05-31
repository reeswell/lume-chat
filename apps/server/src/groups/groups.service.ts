import type { CreateGroupDto, UpdateGroupSettingsDto } from './dto'
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { friendRoomId, publicUserSelect } from '../common/selects'
import { ConversationsService } from '../conversations/conversations.service'
import { PrismaService } from '../prisma/prisma.service'
import { RealtimeService } from '../realtime/realtime.service'

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversations: ConversationsService,
    private readonly realtime: RealtimeService,
  ) {}

  async create(userId: string, dto: CreateGroupDto) {
    const owner = await this.prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect() })
    if (!owner)
      throw new NotFoundException('User not found')

    const group = await this.prisma.chatGroup.create({
      data: {
        groupCode: this.makeGroupCode(),
        title: dto.title,
        desc: dto.desc ?? '',
        img: dto.img ?? '/img/group.svg',
        type: dto.type ?? 'group',
        joinApproval: dto.joinApproval ?? false,
        holderId: userId,
        holderName: owner.userName,
        members: {
          create: {
            userId,
            userName: owner.userName,
            manager: true,
            holder: true,
            card: owner.nickname,
          },
        },
      },
    })

    await this.conversations.upsert(userId, {
      roomId: group.id,
      title: group.title,
      avatar: group.img,
      type: group.type,
      groupId: group.id,
    })

    return group
  }

  async myGroups(userId: string) {
    const [memberRows, removedConversations] = await Promise.all([
      this.prisma.groupMember.findMany({
        where: { userId },
        include: { group: true },
        orderBy: { id: 'desc' },
      }),
      this.prisma.conversation.findMany({
        where: {
          ownerId: userId,
          groupId: { not: null },
          removedAt: { not: null },
        },
        select: { groupId: true, removedAt: true },
        orderBy: { lastMessageAt: 'desc' },
      }),
    ])

    const activeGroups = memberRows.map(row => ({ ...row.group, removedAt: null }))
    const activeIds = new Set(activeGroups.map(group => group.id))
    const removedByGroupId = new Map<string, Date>()
    for (const conversation of removedConversations) {
      if (
        conversation.groupId === null
        || conversation.groupId === undefined
        || conversation.removedAt === null
        || activeIds.has(conversation.groupId)
      ) {
        continue
      }
      if (!removedByGroupId.has(conversation.groupId))
        removedByGroupId.set(conversation.groupId, conversation.removedAt)
    }

    const removedGroups = removedByGroupId.size
      ? await this.prisma.chatGroup.findMany({ where: { id: { in: [...removedByGroupId.keys()] } } })
      : []
    const removedGroupById = new Map(removedGroups.map(group => [group.id, group]))

    return [
      ...activeGroups,
      ...[...removedByGroupId.entries()].flatMap(([groupId, removedAt]) => {
        const group = removedGroupById.get(groupId)
        return group ? [{ ...group, removedAt }] : []
      }),
    ]
  }

  async search(q: string) {
    const keyword = q.trim()
    if (!keyword)
      return []
    return this.prisma.chatGroup.findMany({
      where: {
        OR: [{ title: { contains: keyword } }, { groupCode: { contains: keyword } }],
      },
      take: 20,
      orderBy: { createDate: 'desc' },
    })
  }

  async detail(id: string) {
    const group = await this.prisma.chatGroup.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: publicUserSelect() } },
          orderBy: [{ holder: 'desc' }, { manager: 'desc' }],
        },
      },
    })
    if (!group)
      throw new NotFoundException('Group not found')
    return group
  }

  async requestJoin(userId: string, groupId: string, message?: string) {
    const [user, group, member] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect() }),
      this.prisma.chatGroup.findUnique({ where: { id: groupId } }),
      this.prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } }),
    ])
    if (!user || !group)
      throw new NotFoundException('User or group not found')
    if (member)
      throw new ConflictException('Already in group')
    if (group.holderId === userId)
      throw new ConflictException('Owner already in group')
    if (!group.joinApproval) {
      const result = await this.addMember(userId, groupId)
      const payload = { groupId, userId }
      this.realtime.emitToUser(userId, 'groupJoined', payload)
      this.realtime.emitToUser(group.holderId, 'groupJoined', payload)
      return result
    }

    const [holder, official, pending] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: group.holderId }, select: publicUserSelect() }),
      this.prisma.user.findUnique({ where: { userName: 'vueChat' }, select: publicUserSelect() }),
      this.prisma.message.findFirst({
        where: {
          senderId: userId,
          targetUserId: group.holderId,
          targetGroupId: groupId,
          type: 'validate',
          state: 'group',
          status: '0',
        },
      }),
    ])
    if (!holder || !official)
      throw new NotFoundException('Group owner not found')
    if (pending)
      throw new ConflictException('Group request pending')

    const roomId = friendRoomId(holder.id, official.id)
    await this.conversations.upsert(holder.id, {
      roomId,
      title: official.nickname,
      avatar: official.avatar,
      type: 'system',
      friendId: official.id,
    })

    const trimmedMessage = message?.trim() ?? ''
    const requestContent = trimmedMessage !== ''
      ? trimmedMessage
      : `我是 ${user.nickname !== '' ? user.nickname : user.userName}`
    const request = await this.prisma.message.create({
      data: {
        roomId,
        senderId: user.id,
        userName: user.userName,
        nickname: user.nickname,
        avatar: user.avatar,
        content: requestContent,
        style: 'validate',
        type: 'validate',
        state: 'group',
        status: '0',
        targetUserId: holder.id,
        targetGroupId: group.id,
      },
    })

    await this.conversations.touch(roomId, `${user.nickname || user.userName} 申请加入 ${group.title}`, user.id)
    this.realtime.emitToRoom(roomId, 'mes', request)
    this.realtime.emitToRoom(roomId, 'takeValidate', request)
    this.realtime.emitToUser(holder.id, 'takeValidate', request)
    return request
  }

  async updateSettings(ownerId: string, groupId: string, dto: UpdateGroupSettingsDto) {
    await this.assertOwner(ownerId, groupId)
    return this.prisma.chatGroup.update({
      where: { id: groupId },
      data: {
        ...(typeof dto.joinApproval === 'boolean' ? { joinApproval: dto.joinApproval } : {}),
      },
    })
  }

  async invite(inviterId: string, groupId: string, targetUserId: string) {
    const [group, inviter, target, inviterMember, targetMember] = await Promise.all([
      this.prisma.chatGroup.findUnique({ where: { id: groupId } }),
      this.prisma.user.findUnique({ where: { id: inviterId }, select: publicUserSelect() }),
      this.prisma.user.findUnique({ where: { id: targetUserId }, select: publicUserSelect() }),
      this.prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: inviterId } } }),
      this.prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: targetUserId } } }),
    ])
    if (!group || !inviter || !target)
      throw new NotFoundException('User or group not found')
    if (!inviterMember)
      throw new ForbiddenException('Only group members can invite')
    if (targetMember)
      throw new ConflictException('Already in group')

    const inviterName = inviter.nickname || inviter.userName
    const targetName = target.nickname || target.userName
    const noticeContent = `${inviterName} 邀请 ${targetName} 加入群聊`

    if (group.holderId !== inviterId && group.joinApproval) {
      return this.createInviteRequest(group, target, noticeContent)
    }

    const result = await this.addMember(targetUserId, groupId, {
      noticeContent,
      unreadForNewMember: true,
    })
    const payload = { groupId, userId: targetUserId }
    for (const userId of new Set([inviterId, group.holderId, targetUserId])) {
      this.realtime.emitToUser(userId, 'groupJoined', payload)
    }
    return { ...result, group }
  }

  async acceptJoinRequest(ownerId: string, messageId: string) {
    const request = await this.prisma.message.findUnique({ where: { id: messageId } })
    if (
      request === null
      || request.type !== 'validate'
      || request.state !== 'group'
      || request.senderId === null
      || request.targetGroupId === null
    ) {
      throw new NotFoundException('Group request not found')
    }
    if (request.targetUserId !== ownerId)
      throw new ConflictException('Only group owner can approve')
    if (request.status !== '0')
      throw new ConflictException('Group request already handled')

    const isInviteRequest = request.content.includes('邀请') && request.content.includes('加入群聊')
    const result = await this.addMember(request.senderId, request.targetGroupId, {
      noticeContent: isInviteRequest ? request.content : undefined,
      unreadForNewMember: isInviteRequest,
    })
    await this.prisma.message.update({
      where: { id: messageId },
      data: { status: '1' },
    })

    const payload = { groupId: request.targetGroupId, userId: request.senderId }
    this.realtime.emitToUser(ownerId, 'groupJoined', payload)
    this.realtime.emitToUser(request.senderId, 'groupJoined', payload)
    return result
  }

  async rejectJoinRequest(ownerId: string, messageId: string) {
    const request = await this.prisma.message.findUnique({ where: { id: messageId } })
    if (!request || request.type !== 'validate' || request.state !== 'group' || request.targetUserId !== ownerId) {
      throw new NotFoundException('Group request not found')
    }
    if (request.status !== '0')
      throw new ConflictException('Group request already handled')
    await this.prisma.message.update({
      where: { id: messageId },
      data: { status: '2' },
    })
    return { ok: true }
  }

  private async addMember(userId: string, groupId: string, options: { inviterName?: string, noticeContent?: string, unreadForNewMember?: boolean } = {}) {
    const [user, group, member] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect() }),
      this.prisma.chatGroup.findUnique({ where: { id: groupId } }),
      this.prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } }),
    ])
    if (!user || !group)
      throw new NotFoundException('User or group not found')
    if (member)
      return { ok: true, roomId: groupId }
    const displayName = user.nickname !== '' ? user.nickname : user.userName
    const noticeContent = options.noticeContent ?? (options.inviterName !== undefined && options.inviterName !== ''
      ? `${options.inviterName} 邀请 ${displayName} 加入群聊`
      : `${displayName} 加入了群聊`)

    await this.prisma.$transaction([
      this.prisma.groupMember.create({
        data: { groupId, userId, userName: user.userName, card: user.nickname },
      }),
      this.prisma.chatGroup.update({ where: { id: groupId }, data: { userNum: { increment: 1 } } }),
      this.prisma.message.create({
        data: {
          roomId: groupId,
          type: 'org',
          style: 'notice',
          content: noticeContent,
          userName: 'system',
          nickname: '系统消息',
          avatar: '',
        },
      }),
    ])

    await this.conversations.upsert(userId, {
      roomId: group.id,
      title: group.title,
      avatar: group.img,
      type: group.type,
      groupId: group.id,
    })
    if (options.unreadForNewMember) {
      await this.prisma.conversation.update({
        where: { ownerId_roomId: { ownerId: userId, roomId: group.id } },
        data: { unread: { increment: 1 } },
      })
    }
    await this.conversations.touch(groupId, noticeContent)

    return { ok: true, roomId: groupId }
  }

  private async createInviteRequest(
    group: { id: string, title: string, holderId: string },
    target: { id: string, userName: string, nickname: string, avatar: string },
    noticeContent: string,
  ) {
    const [holder, official, pending] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: group.holderId }, select: publicUserSelect() }),
      this.prisma.user.findUnique({ where: { userName: 'vueChat' }, select: publicUserSelect() }),
      this.prisma.message.findFirst({
        where: {
          senderId: target.id,
          targetUserId: group.holderId,
          targetGroupId: group.id,
          type: 'validate',
          state: 'group',
          status: '0',
        },
      }),
    ])
    if (!holder || !official)
      throw new NotFoundException('Group owner not found')
    if (pending)
      throw new ConflictException('Group request pending')

    const roomId = friendRoomId(holder.id, official.id)
    await this.conversations.upsert(holder.id, {
      roomId,
      title: official.nickname,
      avatar: official.avatar,
      type: 'system',
      friendId: official.id,
    })

    const request = await this.prisma.message.create({
      data: {
        roomId,
        senderId: target.id,
        userName: target.userName,
        nickname: target.nickname,
        avatar: target.avatar,
        content: noticeContent,
        style: 'validate',
        type: 'validate',
        state: 'group',
        status: '0',
        targetUserId: holder.id,
        targetGroupId: group.id,
      },
    })

    await this.conversations.touch(roomId, noticeContent, target.id)
    this.realtime.emitToRoom(roomId, 'mes', request)
    this.realtime.emitToRoom(roomId, 'takeValidate', request)
    this.realtime.emitToUser(holder.id, 'takeValidate', request)
    return request
  }

  async removeMember(ownerId: string, groupId: string, memberId: string) {
    const group = await this.assertOwner(ownerId, groupId)
    if (memberId === ownerId)
      throw new ConflictException('Owner cannot remove self')

    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: memberId } },
      include: { user: { select: publicUserSelect() } },
    })
    if (!member)
      throw new NotFoundException('Group member not found')
    if (member.holder)
      throw new ConflictException('Owner cannot be removed')
    const removedAt = new Date()

    await this.prisma.$transaction([
      this.prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId: memberId } } }),
      this.prisma.chatGroup.update({ where: { id: groupId }, data: { userNum: { decrement: 1 } } }),
      this.prisma.conversation.updateMany({
        where: { ownerId: memberId, roomId: groupId },
        data: { removedAt, unread: 0 },
      }),
      this.prisma.message.create({
        data: {
          roomId: groupId,
          type: 'org',
          style: 'notice',
          content: `${member.user.nickname || member.userName} 已被移出群聊`,
          targetUserId: memberId,
          nickname: member.user.nickname,
          avatar: member.user.avatar,
        },
      }),
    ])

    await this.conversations.touch(groupId, `${member.user.nickname || member.userName} 已被移出群聊`)
    const payload = { groupId, userId: memberId }
    this.realtime.emitToUser(ownerId, 'groupRemoved', payload)
    this.realtime.emitToUser(memberId, 'groupRemoved', payload)
    this.realtime.removeUserFromRoom(memberId, groupId)
    return { ok: true, group }
  }

  async dissolve(ownerId: string, groupId: string) {
    const group = await this.assertOwner(ownerId, groupId)
    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    })

    await this.prisma.$transaction([
      this.prisma.message.deleteMany({ where: { roomId: groupId } }),
      this.prisma.conversation.deleteMany({ where: { roomId: groupId } }),
      this.prisma.chatGroup.delete({ where: { id: groupId } }),
    ])

    const payload = { groupId, userIds: members.map(member => member.userId) }
    for (const member of members) this.realtime.emitToUser(member.userId, 'groupRemoved', payload)
    this.realtime.emitToRoom(groupId, 'groupRemoved', payload)
    return { ok: true, group }
  }

  async quit(userId: string, groupId: string) {
    const group = await this.prisma.chatGroup.findUnique({ where: { id: groupId } })
    if (!group)
      throw new NotFoundException('Group not found')
    if (group.holderId === userId)
      throw new ConflictException('Owner cannot quit the group')

    await this.prisma.$transaction([
      this.prisma.groupMember.deleteMany({ where: { userId, groupId } }),
      this.prisma.chatGroup.update({ where: { id: groupId }, data: { userNum: { decrement: 1 } } }),
      this.prisma.conversation.deleteMany({ where: { ownerId: userId, roomId: groupId } }),
    ])
    return { ok: true }
  }

  private async assertOwner(ownerId: string, groupId: string) {
    const group = await this.prisma.chatGroup.findUnique({ where: { id: groupId } })
    if (!group)
      throw new NotFoundException('Group not found')
    if (group.holderId !== ownerId)
      throw new ForbiddenException('Only group owner can manage this group')
    return group
  }

  private makeGroupCode() {
    return `G${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  }
}
