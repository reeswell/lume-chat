import type { AuthUser } from '../common/current-user.decorator'
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../common/current-user.decorator'
import { JwtAuthGuard } from '../common/jwt-auth.guard'
import { CreateMessageDto } from './dto'
import { MessagesService } from './messages.service'

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get(':roomId/search')
  async search(@CurrentUser() user: AuthUser, @Param('roomId') roomId: string, @Query('q') q = '') {
    return this.messages.search(roomId, user.id, q)
  }

  @Get(':roomId')
  async history(@CurrentUser() user: AuthUser, @Param('roomId') roomId: string, @Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    return this.messages.history(roomId, {
      cursor,
      limit: limit !== undefined && limit !== '' ? Number(limit) : undefined,
      userId: user.id,
    })
  }

  @Post()
  async send(@CurrentUser() user: AuthUser, @Body() dto: CreateMessageDto) {
    return this.messages.save({ ...dto, senderId: user.id })
  }

  @Post(':roomId/read')
  async markRead(@CurrentUser() user: AuthUser, @Param('roomId') roomId: string) {
    return this.messages.markRead(roomId, user.id)
  }
}
