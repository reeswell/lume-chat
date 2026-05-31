import { Module } from '@nestjs/common'
import { ConversationsModule } from '../conversations/conversations.module'
import { RealtimeModule } from '../realtime/realtime.module'
import { FriendsController } from './friends.controller'
import { FriendsService } from './friends.service'

@Module({
  imports: [ConversationsModule, RealtimeModule],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
