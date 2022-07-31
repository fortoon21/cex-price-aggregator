import debug from 'debug';
import _ from 'lodash';
import Binance from 'node-binance-api';
import { DB } from '../db';
import { Exchange, updatePrice } from './common';

const log = debug('app:exchange:binance');

type BookTickerResp = {
  updateId: number;
  symbol: string;
  bestBid: string;
  bestBidQty: string;
  bestAsk: string;
  bestAskQty: string;
};

const symbs = {
  atom: 'ATOMUSDC',
  eth: 'ETHUSDC',
  btc: 'BTCUSDC',
  band: 'BANDUSDT',
  mkr: 'MKRUSDT',
};

const THROTTLE_TIME = 500;

export class PollBinance extends Exchange {
  constructor(db: DB) {
    super('binance', db);
  }
  async start() {
    await super.start();

    const binance = new Binance();

    _.forEach(symbs, (symb, base) => {
      const calcPrice = _.throttle((ticker: BookTickerResp) => {
        if (typeof ticker.bestBid !== 'string' || typeof ticker.bestAsk !== 'string') {
          return;
        }
        const avgPrice = (parseFloat(ticker.bestBid) + parseFloat(ticker.bestAsk)) / 2;
        log(base, avgPrice);
        this.priceData = updatePrice(this.priceData, base, avgPrice);
        this.e.emit('update');
      }, THROTTLE_TIME);
      binance.websockets.bookTickers(symb, calcPrice);
    });
  }
}
