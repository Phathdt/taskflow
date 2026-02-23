import { InjectRedis } from '@nestjs-modules/ioredis'
import { Injectable } from '@nestjs/common'

import Redis from 'ioredis'

import { type ISessionStoreService } from '../../domain'

@Injectable()
export class SessionRedisRepository implements ISessionStoreService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async save(userId: number, subToken: string, signature: string, ttlSeconds: number): Promise<void> {
    const key = this._key(userId, subToken)
    await this.redis.set(key, signature, 'EX', ttlSeconds)
  }

  async get(userId: number, subToken: string): Promise<string | null> {
    const key = this._key(userId, subToken)
    return this.redis.get(key)
  }

  async removeAllForUser(userId: number): Promise<void> {
    const pattern = `/users/${userId}/session/*`
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }

  private _key(userId: number, subToken: string): string {
    return `/users/${userId}/session/${subToken}`
  }
}
