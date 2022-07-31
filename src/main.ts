import debug from 'debug';
import { RedisDB } from './db';
import { PollBinance, PollBitfinex } from './exchanges';

const log = debug('app:main');

(async () => {
  const db = new RedisDB();
  await db.connect();

  new PollBinance(db).start();
  new PollBitfinex(db).start();
})();
