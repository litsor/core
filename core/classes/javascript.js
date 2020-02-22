/* eslint-disable no-await-in-loop */
'use strict';

const {isImmutable, fromJS} = require('immutable');

class Context {
  constructor(data, correlationId = '') {
    if (isImmutable(data)) {
      this.data = data;
    } else {
      this.data = fromJS(data);
    }
    this.unassignedValue = undefined;
    this.correlationId = correlationId;
    this.line = 1;
    this.parent = null;
    this.child = null;
    this.scriptState = null;
    this.methodState = null;
    this.killed = false;
  }

  setLine(line) {
    this.line = line;
    if (this.parent) {
      this.parent.setLine(line);
    }
  }

  kill() {
    this.killed = true;
    if (this.child) {
      this.child.kill();
    }
  }

  getRoot() {
    return this.parent ? this.parent.getRoot() : this;
  }

  export() {
    return {
      data: this.data,
      scriptState: this.scriptState,
      methodState: this.methodState,
      child: this.child ? this.child.export() : null,
      correlationId: this.correlationId
    };
  }

  import(state) {
    this.data = state.data;
    this.scriptState = state.scriptState;
    this.methodState = state.methodState;
    if (state.child) {
      this.child = new Context({}, this.correlationId);
      this.child.import(state.child);
    }
  }
}

class Javascript {
  constructor({Methods, Graphql, Log, Statistics}) {
    this.methods = Methods;
    this.graphql = Graphql;
    this.log = Log;
    this.statistics = Statistics;

    this.id = null;
    this.statistic = null;

    this.processes = [];
    this.lastProcessId = 0;
  }

  load(script) {
    this.script = eval(`module.exports = async (data, {graphql, log, methods}) => { ${script} }`);
  }

  setId(id) {
    this.id = id;
    this.statistics.add('Histogram', 'script_duration_seconds', 'script', 'script execution time').then(statistic => {
      this.statistic = statistic;
    });
  }

  getId() {
    return this.id;
  }

  getProcessList() {
    const now = new Date();
    return Object.keys(this.processes).map(processId => ({
      processId,
      correlationId: this.processes[processId].context.correlationId,
      line: this.processes[processId].context.line,
      runningTime: now - this.processes[processId].start,
      killed: this.processes[processId].context.killed
    }));
  }

  async kill() {
    // Not supported.
  }

  async resume() {
    // Not supported.
  }

  async run(data, options = {}) {
    const returnContext = options.returnContext || false;

    const processId = ++this.lastProcessId;
    const correlationId = this.log.generateCorrelationId();
    const context = options.context || new Context(data, correlationId);
    const start = new Date();

    this.processes[processId] = {
      context,
      start
    };

    try {
      context.data = await this.script(data, {
        graphql: this.graphql,
        log: this.log,
        methods: this.methods
      });
    } catch (err) {
      delete this.processes[processId];
      throw err;
    }

    delete this.processes[processId];
    const time = (new Date() - start) / 1e3;
    this.statistic && this.statistic.add(time, {script: this.id});

    return returnContext ? context : (
      isImmutable(context.data) ? context.data.toJS() : context.data
    );
  }
}

Javascript.require = ['Container', 'Methods', 'Input', 'Log', 'Graphql', 'Statistics'];

module.exports = Javascript;
