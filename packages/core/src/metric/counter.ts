import {Injectable} from '@nestjs/common';

import {Adapter, Counter as CounterInterface, Tags} from '../adapter';
import {Metric} from './metric';

@Injectable()
export class Counter extends Metric {
  inc(delta?: number, label?: string, tags?: Tags, adapter?: string): void {
    (this.searchAdapters(
      adapter ? adapter : (value: Adapter): unknown => value.kind === 'counter',
    ) as CounterInterface[]).forEach((counter) => {
      counter.inc(delta, label, tags);
    });
  }
}
