import EventEmitter from 'events';
import _ from 'lodash';
import { DB } from '../db';

const SMOOTHING_FACTOR = 0.2;

export type PriceData = {
  time: string;
  exchange: string;
  prices: Record<string, number>;
};

export const updatePrice = (latestPriceData: PriceData, base: string, newPrice: number): PriceData => {
  let ema: number;
  if (_.isEmpty(latestPriceData.prices[base])) {
    ema = newPrice;
  } else {
    const oldPrice = latestPriceData.prices[base];
    ema = oldPrice * (1 - SMOOTHING_FACTOR) + newPrice * SMOOTHING_FACTOR;
  }

  return _.merge(latestPriceData, {
    time: new Date().toISOString(),
    prices: {
      [base]: ema,
    },
  });
};

export class Exchange {
  name: string;
  db: DB;
  priceData: PriceData;
  e: EventEmitter;

  constructor(name: string, db: DB) {
    this.name = name;
    this.db = db;
    this.priceData = {
      exchange: this.name,
      time: new Date().toISOString(),
      prices: {},
    };
    this.e = new EventEmitter();
    this.e.on('update', async () => {
      const data = JSON.stringify(this.priceData);
      await this.db.set(`cex:${this.name}:latestPrice`, data);
    });
  }

  async start() {
    await this.initPriceData();
  }

  async initPriceData() {
    const initialDataString = await this.db.get(`cex:${this.name}:latestPrice`);
    if (_.isNull(initialDataString)) {
      return;
    }
    const initialData = JSON.parse(initialDataString);
    if (_.isObject(initialData.prices)) {
      this.priceData.prices = initialData.prices;
    }
  }
}
