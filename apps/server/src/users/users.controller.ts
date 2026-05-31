import type { AuthUser } from '../common/current-user.decorator'
import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../common/current-user.decorator'
import { JwtAuthGuard } from '../common/jwt-auth.guard'
import { UpdateUserDto } from './dto'
import { UsersService } from './users.service'

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return this.users.me(user.id)
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateUserDto) {
    return this.users.update(user.id, dto)
  }

  @Get('official')
  async official() {
    return this.users.official()
  }

  @Get('search')
  async search(@CurrentUser() user: AuthUser, @Query('q') q = '') {
    return this.users.search(user.id, q)
  }

  @Get(':id')
  async publicUser(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.users.getPublicUser(user.id, id)
  }
}
