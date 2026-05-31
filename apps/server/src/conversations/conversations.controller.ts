import type { AuthUser } from '../common/current-user.decorator'
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../common/current-user.decorator'
import { JwtAuthGuard } from '../common/jwt-auth.guard'
import { ConversationsService } from './conversations.service'
import { UpsertConversationDto } from './dto'

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    return this.conversations.list(user.id)
  }

  @Post()
  async upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertConversationDto) {
    return this.conversations.upsert(user.id, dto)
  }

  @Post(':roomId/read')
  async markRead(@CurrentUser() user: AuthUser, @Param('roomId') roomId: string) {
    return this.conversations.markRead(user.id, roomId)
  }

  @Delete(':roomId')
  async remove(@CurrentUser() user: AuthUser, @Param('roomId') roomId: string) {
    return this.conversations.remove(user.id, roomId)
  }
}
