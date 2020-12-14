import * as chai from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { Counter, Gauge, Histogram, Summary } from '../src/adapter/dummies';
import { Tags, TimerMethod } from '../src/adapter/interfaces';
import { MetricsAdapters } from '../src/config';
import {
    Counter as CounterMetric, Gauge as GaugeMetric, Histogram as HistogramMetric,
    Summary as SummaryMetric
} from '../src/metric';
import { DecoratedMetricsController, withValues, withValues2 } from './utils/controllers';
import { TestHarness } from './utils/harness';
import { createTestModule } from './utils/module';

import Sinon = require('sinon');

chai.use(sinonChai);
const expect = chai.expect;

// eslint-disable-next-line mocha/no-skipped-tests,mocha/no-mocha-arrows
describe('src/adapter', () => {
  let adapters: MetricsAdapters;
  let controller: DecoratedMetricsController;
  let harness: TestHarness;
  let sandbox: sinon.SinonSandbox;
  // eslint-disable-next-line mocha/no-setup-in-describe
  const endTimer: Sinon.SinonSpy = sinon.fake();

  // eslint-disable-next-line mocha/no-mocha-arrows
  beforeEach(async () => {
    adapters = {
      counter: new Counter(),
      counter2: new Counter(),
      gauge: new Gauge(),
      histogram: new Histogram(),
      summary: new Summary(),
    };

    harness = await createTestModule(
      {
        adapters,
      },
      {
        controllers: [DecoratedMetricsController],
        providers: [CounterMetric, GaugeMetric, HistogramMetric, SummaryMetric],
      },
    );

    controller = harness.app.get<DecoratedMetricsController>(DecoratedMetricsController);

    sandbox = sinon.createSandbox();

    sandbox.spy(adapters.counter, 'inc');

    sandbox.spy(adapters.gauge, 'dec');
    sandbox.spy(adapters.gauge, 'inc');
    sandbox.spy(adapters.gauge, 'set');
    sandbox.spy(adapters.gauge, 'startTimer');

    sandbox.spy(adapters.histogram, 'observe');
    sandbox.spy(adapters.histogram, 'reset');
    sandbox.spy(adapters.histogram, 'startTimer');

    sandbox.spy(adapters.summary, 'observe');
    sandbox.spy(adapters.summary, 'reset');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    adapters.summary.startTimer = (label?: string, tags?: Tags, adapter?: string): TimerMethod =>
      endTimer as TimerMethod;
  });

  // eslint-disable-next-line mocha/no-mocha-arrows
  afterEach(async () => {
    if (harness) {
      await harness.app.close();
      harness = undefined;
    }

    sandbox.restore();
  });

  describe('@EventIncrement', () => {
    it(`@EventIncrement(...${JSON.stringify(
      withValues('counter'),
    )}, 'counter') should call inc() on 'counter' adapter`, async () => {
      controller.triggerCounterIncByAdapterName();

      expect(adapters.counter.inc).to.have.been.called;
      expect(adapters.counter.inc).to.have.been.calledWith(...withValues('counter'));
    });

    it(`@EventIncrement(...${JSON.stringify(
      withValues('counter'),
    )}, null, Counter) should call inc() on all adapters of type Counter`, async () => {
      controller.triggerCounterIncByCounterMetric();

      expect(adapters.counter.inc).to.have.been.called;
      expect(adapters.counter.inc).to.have.been.calledWith(...withValues('counter'));
    });

    it(`@EventIncrement(...${JSON.stringify(
      withValues('counter'),
    )}, null, Gauge) should call inc() on all adapters of type Gauge`, async () => {
      controller.triggerGaugeIncByGaugeMetric();

      expect(adapters.gauge.inc).to.have.been.called;
      expect(adapters.gauge.inc).to.have.been.calledWith(...withValues('gauge'));
    });

    it(`@EventIncrement(...${JSON.stringify(
      withValues('all_inc'),
    )}) should call inc() on all adapters of type Counter or Gauge`, async () => {
      controller.triggerIncByOnAllIncMetrics();

      expect(adapters.counter.inc).to.have.been.called;
      expect(adapters.counter.inc).to.have.been.calledWith(...withValues('all_inc'));

      expect(adapters.gauge.inc).to.have.been.called;
      expect(adapters.gauge.inc).to.have.been.calledWith(...withValues('all_inc'));
    });

    it('generic', () => {
      expect(true).to.equal(true);
    });
  });

  describe('@EventDecrement', () => {
    it(`@EventDecrement(...${JSON.stringify(
      withValues('gauge'),
    )}, 'gauge') should call dec() on 'gauge' adapter`, async () => {
      controller.triggerGaugeDecByAdapterName();

      expect(adapters.gauge.dec).to.have.been.called;
      expect(adapters.gauge.dec).to.have.been.calledWith(...withValues('gauge'));
    });

    it(`@EventDecrement(...${JSON.stringify(
      withValues('gauge'),
    )}) should call dec() on all Gauge adapter`, async () => {
      controller.triggerDecOnAllGaugeMetrics();

      expect(adapters.gauge.dec).to.have.been.called;
      expect(adapters.gauge.dec).to.have.been.calledWith(...withValues('gauge'));
    });

    it('generic', () => {
      expect(true).to.equal(true);
    });
  });

  describe('@EventDuration', () => {
    it(`@EventDuration(...${JSON.stringify(
      withValues2('gauge'),
    )}, 'gauge') should call startTimer() on 'gauge' adapter`, async () => {
      controller.triggerDurationByAdapterName();

      expect(adapters.gauge.startTimer).to.have.been.called;
      expect(adapters.gauge.startTimer).to.have.been.calledWith(...withValues2('gauge'));
    });

    it(`@EventDuration(...${JSON.stringify(
      withValues2('gauge'),
    )}, 'gauge') should call startTimer() on 'gauge' adapter (async/then)`, async () => {
      await controller.asyncTriggerDurationByAdapterName();

      expect(adapters.gauge.startTimer).to.have.been.called;
      expect(adapters.gauge.startTimer).to.have.been.calledWith(...withValues2('gauge'));
    });

    it(`@EventDuration(...${JSON.stringify(
      withValues2('gauge'),
    )}, 'gauge') should call startTimer() on 'gauge' adapter (async/catch)`, async () => {
      try {
        await controller.asyncFailTriggerDurationByAdapterName();
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(adapters.gauge.startTimer).to.have.been.called;
      expect(adapters.gauge.startTimer).to.have.been.calledWith(...withValues2('gauge'));
    });

    it(`@EventDuration(...${JSON.stringify(
      withValues2('gauge'),
    )}, null, Gauge) should call startTimer() on all adapters of type Gauge`, async () => {
      controller.triggerDurationByGaugeMetrics();

      expect(adapters.gauge.startTimer).to.have.been.called;
      expect(adapters.gauge.startTimer).to.have.been.calledWith(...withValues2('gauge'));
    });

    it(`@EventDuration(...${JSON.stringify(
      withValues2('histogram'),
    )}, null, Histogram) should call startTimer() on all adapters of type Histogram`, async () => {
      controller.triggerDurationByHistogramMetrics();

      expect(adapters.histogram.startTimer).to.have.been.called;
      expect(adapters.histogram.startTimer).to.have.been.calledWith(...withValues2('histogram'));
    });

    it(`@EventDuration(...${JSON.stringify(
      withValues2('summary'),
    )}, null, Summary) should call startTimer() on all adapters of type Summary`, async () => {
      controller.triggerDurationBySummaryMetrics();

      expect(endTimer).to.have.been.called;
      expect(endTimer).to.have.been.calledWith(withValues2('summary')[1]);
    });

    it(`@EventDuration(...${JSON.stringify(
      withValues2('summary'),
    )}, null, Summary) should call startTimer() on all adapters of type Summary (async)`, async () => {
      await controller.asyncTriggerDurationBySummaryMetrics();

      expect(endTimer).to.have.been.called;
      expect(endTimer).to.have.been.calledWith(withValues2('summary')[1]);
    });

    it(`@EventDuration(...${JSON.stringify(
      withValues2('multi_duration'),
    )}, null, [Histogram, Summary]) should call startTimer() on all adapters of type Histogram or Summary`, async () => {
      controller.triggerDurationByMultipleMetrics();

      expect(adapters.histogram.startTimer).to.have.been.called;
      expect(adapters.histogram.startTimer).to.have.been.calledWith(...withValues2('multi_duration'));

      expect(endTimer).to.have.been.called;
      expect(endTimer).to.have.been.calledWith(withValues2('multi_duration')[1]);
    });

    it(`@EventDuration(...${JSON.stringify(
      withValues2('all_duration'),
    )}) should call startTimer() on all adapters`, async () => {
      controller.triggerDurationByAllMetrics();

      expect(adapters.gauge.startTimer).to.have.been.called;
      expect(adapters.gauge.startTimer).to.have.been.calledWith(...withValues2('all_duration'));

      expect(adapters.histogram.startTimer).to.have.been.called;
      expect(adapters.histogram.startTimer).to.have.been.calledWith(...withValues2('all_duration'));

      expect(endTimer).to.have.been.called;
      expect(endTimer).to.have.been.calledWith(withValues2('all_duration')[1]);
    });

    it('generic', () => {
      expect(true).to.equal(true);
    });
  });

  it('generic', () => {
    expect(true).to.equal(true);
  });
});
