import type { UpdateUserDto } from './dto'
import { Injectable, NotFoundException } from '@nestjs/common'
import { publicUserSelect } from '../common/selects'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private publicProfileSelect() {
    return {
      id: true,
      userName: true,
      nickname: true,
      avatar: true,
      province: true,
      city: true,
    }
  }

  async me(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...publicUserSelect(),
        signUpTime: true,
        lastLoginTime: true,
        conversations: { orderBy: [{ pinned: 'desc' }, { lastMessageAt: 'desc' }] },
      },
    })
    if (!user)
      throw new NotFoundException('User not found')
    return user
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: publicUserSelect(),
    })
  }

  async official() {
    const user = await this.prisma.user.findUnique({
      where: { userName: 'vueChat' },
      select: publicUserSelect(),
    })
    if (!user)
      throw new NotFoundException('Official account not seeded')
    return user
  }

  async search(currentUserId: string, q: string) {
    const keyword = q.trim()
    if (!keyword)
      return []

    return this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        userName: { not: 'vueChat' },
        OR: [
          { userName: { contains: keyword } },
          { nickname: { contains: keyword } },
          { mobilePhone: { contains: keyword } },
        ],
      },
      select: this.publicProfileSelect(),
      take: 20,
    })
  }

  async getPublicUser(viewerId: string, id: string) {
    const isSelf = viewerId === id
    const friendship = isSelf
      ? true
      : await this.prisma.friend.findUnique({
          where: { selfId_otherId: { selfId: viewerId, otherId: id } },
          select: { id: true },
        })
    const hasFriendAccess = friendship === true || friendship !== null
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: hasFriendAccess
        ? publicUserSelect()
        : this.publicProfileSelect(),
    })
    if (!user)
      throw new NotFoundException('User not found')
    return user
  }
}
