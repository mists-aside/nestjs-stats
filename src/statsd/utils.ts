import * as StatsdClient from 'statsd-client';

import {DummyStatsdClient} from './dummy';
import {StatsDOptions, StatsDClientAlike} from './options';

const instances: {[key: string]: StatsdClient} = {};

/**
 * @ignore
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getToken = (name: string): string => `STATSD_CLIENT_${name}`;

/**
 * @ignore
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getStatsdClient = (name: string, options: StatsDOptions): StatsDClientAlike => {
  const token = getToken(name);
  if (!instances[token]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instances[token] = DummyStatsdClient as StatsdClient;
    if (options !== 'dummy') {
      instances[token] = new StatsdClient(options);
    }
  }
  return instances[token];
};
