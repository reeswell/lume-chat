import type { OnModuleDestroy } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis

  constructor(config: ConfigService) {
    this.client = new Redis(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    })

    this.client.on('error', () => {
      // Redis is used for online presence only; API features continue without it.
    })
  }

  async rememberOnline(userName: string, socketId: string) {
    try {
      if (this.client.status === 'wait')
        await this.client.connect()
      await this.client.hset('online-users', userName, socketId)
    }
    catch {}
  }

  async forgetOnline(userName: string, socketId?: string) {
    try {
      if (this.client.status === 'wait')
        await this.client.connect()
      if (socketId !== undefined && socketId !== '') {
        const currentSocketId = await this.client.hget('online-users', userName)
        if (currentSocketId !== null && currentSocketId !== '' && currentSocketId !== socketId)
          return
      }
      await this.client.hdel('online-users', userName)
    }
    catch {}
  }

  async listOnline() {
    try {
      if (this.client.status === 'wait')
        await this.client.connect()
      return await this.client.hgetall('online-users')
    }
    catch {
      return {}
    }
  }

  async onModuleDestroy() {
    await this.client.quit()
  }
}
