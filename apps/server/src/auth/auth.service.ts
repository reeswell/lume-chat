import type { LoginDto, RegisterDto } from './dto'
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Prisma } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { friendRoomId, publicUserSelect } from '../common/selects'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10)
    try {
      const user = await this.prisma.user.create({
        data: {
          userName: dto.userName,
          passwordHash,
          mobilePhone: dto.mobilePhone,
          nickname: dto.nickname ?? dto.userName,
        },
        select: publicUserSelect(),
      })

      await this.ensureOfficialConversation(user.id)
      return this.issueSession(user)
    }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('User name or phone already exists')
      }
      throw error
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { userName: dto.userName } })
    if (!user)
      throw new UnauthorizedException('Invalid credentials')

    const ok = await bcrypt.compare(dto.password, user.passwordHash)
    if (!ok)
      throw new UnauthorizedException('Invalid credentials')

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginTime: new Date() },
      select: publicUserSelect(),
    })
    await this.ensureOfficialConversation(user.id)
    return this.issueSession(updated)
  }

  private issueSession(user: Record<string, unknown> & { id: string, userName: string }) {
    return {
      token: this.jwt.sign({ id: user.id, userName: user.userName }),
      user,
    }
  }

  private async ensureOfficialConversation(userId: string) {
    const official = await this.prisma.user.findUnique({ where: { userName: 'vueChat' } })
    if (!official || official.id === userId)
      return

    const roomId = friendRoomId(userId, official.id)
    await this.prisma.conversation.upsert({
      where: { ownerId_roomId: { ownerId: userId, roomId } },
      create: {
        ownerId: userId,
        roomId,
        title: official.nickname,
        avatar: official.avatar,
        type: 'system',
        friendId: official.id,
      },
      update: {},
    })
  }
}
