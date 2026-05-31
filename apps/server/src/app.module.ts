import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { ChatModule } from './chat/chat.module'
import { ConversationsModule } from './conversations/conversations.module'
import { FriendsModule } from './friends/friends.module'
import { GroupsModule } from './groups/groups.module'
import { MessagesModule } from './messages/messages.module'
import { PrismaModule } from './prisma/prisma.module'
import { RealtimeModule } from './realtime/realtime.module'
import { RedisModule } from './redis/redis.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['../../.env', '.env'], isGlobal: true }),
    PrismaModule,
    RealtimeModule,
    RedisModule,
    AuthModule,
    UsersModule,
    ConversationsModule,
    FriendsModule,
    GroupsModule,
    MessagesModule,
    ChatModule,
  ],
})
export class AppModule {}
