import { Module } from '@nestjs/common'
import { ConversationsModule } from '../conversations/conversations.module'
import { MessagesController } from './messages.controller'
import { MessagesService } from './messages.service'

@Module({
  imports: [ConversationsModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
