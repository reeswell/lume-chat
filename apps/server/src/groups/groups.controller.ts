import type { AuthUser } from '../common/current-user.decorator'
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../common/current-user.decorator'
import { JwtAuthGuard } from '../common/jwt-auth.guard'
import { CreateGroupDto, GroupInviteDto, GroupJoinRequestDto, UpdateGroupSettingsDto } from './dto'
import { GroupsService } from './groups.service'

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get()
  async myGroups(@CurrentUser() user: AuthUser) {
    return this.groups.myGroups(user.id)
  }

  @Get('search')
  async search(@Query('q') q = '') {
    return this.groups.search(q)
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateGroupDto) {
    return this.groups.create(user.id, dto)
  }

  @Post('requests/:messageId/accept')
  async acceptRequest(@CurrentUser() user: AuthUser, @Param('messageId') messageId: string) {
    return this.groups.acceptJoinRequest(user.id, messageId)
  }

  @Post('requests/:messageId/reject')
  async rejectRequest(@CurrentUser() user: AuthUser, @Param('messageId') messageId: string) {
    return this.groups.rejectJoinRequest(user.id, messageId)
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.groups.detail(id)
  }

  @Patch(':id/settings')
  async updateSettings(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateGroupSettingsDto) {
    return this.groups.updateSettings(user.id, id, dto)
  }

  @Post(':id/invite')
  async invite(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: GroupInviteDto) {
    return this.groups.invite(user.id, id, dto.targetUserId)
  }

  @Post(':id/request')
  async requestJoin(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: GroupJoinRequestDto) {
    return this.groups.requestJoin(user.id, id, dto.message)
  }

  @Delete(':id/members/:userId')
  async removeMember(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('userId') userId: string) {
    return this.groups.removeMember(user.id, id, userId)
  }

  @Delete(':id/quit')
  async quit(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.groups.quit(user.id, id)
  }

  @Delete(':id')
  async dissolve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.groups.dissolve(user.id, id)
  }
}
