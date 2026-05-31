import type { AuthUser } from '../common/current-user.decorator'
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../common/current-user.decorator'
import { JwtAuthGuard } from '../common/jwt-auth.guard'
import { FriendRequestDto } from './dto'
import { FriendsService } from './friends.service'

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    return this.friends.list(user.id)
  }

  @Get('check/:userId')
  async check(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.friends.check(user.id, userId)
  }

  @Post('request')
  async request(@CurrentUser() user: AuthUser, @Body() dto: FriendRequestDto) {
    return this.friends.request(user.id, dto)
  }

  @Post(':userId/accept')
  async accept(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.friends.accept(user.id, userId)
  }

  @Delete(':userId')
  async remove(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.friends.remove(user.id, userId)
  }
}
