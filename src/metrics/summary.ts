import {Metrics} from '../enum';
import {Histogram} from './histogram';
import {SummaryOptions} from './options';
import {getPrometheusMetric} from '../prometheus/utils';

export class Summary extends Histogram {
  constructor(name: string, options?: SummaryOptions) {
    super(name, options);

    this.prometheusMetric = getPrometheusMetric(Metrics.Summary, {
      ...(this.options.prometheus || {}),
      name,
      ...{help: this.options.prometheus ? this.options.prometheus.help || name : name},
    });
  }
}
