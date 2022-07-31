import { WSv2 } from 'bitfinex-api-node';
import debug from 'debug';
import _ from 'lodash';
import { DB } from '../db';
import { Exchange, updatePrice } from './common';

const log = debug('app:exchange:bitfinex');

const symbs = {
  btc: 'tBTCUSD',
  eth: 'tETHUSD',
  atom: 'tATOUSD',
  band: 'tBAND:USD',
  mkr: 'tMKRUSD',
};

const THROTTLE_TIME = 500;

export class PollBitfinex extends Exchange {
  constructor(db: DB) {
    super('bitfinex', db);
  }
  async start() {
    await super.start();

    const ws = new WSv2({ transform: true });
    await ws.open();

    _.forEach(symbs, (symb, base) => {
      const calcPrice = _.throttle((trade) => {
        if (!_.isNumber(trade.price)) {
          return;
        }
        log(base, trade.price);
        this.priceData = updatePrice(this.priceData, base, trade.price);
        this.e.emit('update');
      }, THROTTLE_TIME);
      ws.subscribeTrades(symb);
      ws.onTrades({ symbol: symb }, calcPrice);
    });
  }
}
