import { Global, Module } from '@nestjs/common'
import { RealtimeService } from './realtime.service'

@Global()
@Module({
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
