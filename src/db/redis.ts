import debug from 'debug';
import * as redis from 'redis';
import { DB } from './interface';

const log = debug('app:db:redis');

type RedisClientType = ReturnType<typeof redis.createClient>;
type RedisClientOptions = Parameters<typeof redis.createClient>[0];

const createRedisClient = (options: RedisClientOptions): RedisClientType => {
  return redis.createClient(options);
};

export class RedisDB implements DB {
  client: RedisClientType;
  constructor() {
    this.client = createRedisClient({
      url: `redis://${process.env.REDIS_ADDR}`,
      password: process.env.REDIS_PASSWORD,
      database: parseInt(`${process.env.REDIS_DB}`),
    });
    this.client.on('error', (err) => log('Redis Client Error', err));
  }

  async connect() {
    await this.client.connect();
    log('connected');
  }

  get(key: string): Promise<string | null> {
    log('get', key);

    return this.client.get(key);
  }

  async set(key: string, value: any): Promise<boolean> {
    log('set', key, value);

    try {
      await this.client.multi().set(key, value).publish(key, value).exec(true);
      return true;
    } catch (e) {
      return false;
    }
  }
}
