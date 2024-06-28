import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { InvalidatedRefreshTokenError } from './invalidated-refresh-token.error';

@Injectable()
export class RefreshTokenIdsStorage
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private redisClient: Redis;

  onApplicationBootstrap() {
    // TODO: Ideally, I should have move this to dedicated RedisModule. Placed here just for simplicity.
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: +process.env.REDIS_PORT,
    });
  }

  onApplicationShutdown(signal?: string) {
    this.redisClient.quit();
  }

  async insert(userId: number, tokenId: string): Promise<void> {
    await this.redisClient.set(this.getKey(userId), tokenId);
  }
  async validate(userId: number, tokenId: string): Promise<boolean> {
    const storedId = await this.redisClient.get(this.getKey(userId));

    if (storedId !== tokenId) {
      throw new InvalidatedRefreshTokenError();
    }

    return storedId === tokenId;
  }
  async invalidate(userId: number): Promise<void> {
    await this.redisClient.del(this.getKey(userId));
  }

  private getKey(userId: number): string {
    return `user-${userId}`;
  }
}
