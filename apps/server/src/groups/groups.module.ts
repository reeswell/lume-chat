import { Module } from '@nestjs/common'
import { ConversationsModule } from '../conversations/conversations.module'
import { RealtimeModule } from '../realtime/realtime.module'
import { GroupsController } from './groups.controller'
import { GroupsService } from './groups.service'

@Module({
  imports: [ConversationsModule, RealtimeModule],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
