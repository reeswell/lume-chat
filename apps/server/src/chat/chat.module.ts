import { Module } from '@nestjs/common'
import { MessagesModule } from '../messages/messages.module'
import { ChatGateway } from './chat.gateway'

@Module({
  imports: [MessagesModule],
  providers: [ChatGateway],
})
export class ChatModule {}
