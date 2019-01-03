'use strict';

class Statistics {
  constructor({Container}) {
    this.container = Container;
    this.statistics = {};
  }

  async add(type, name, help) {
    if (['Counter', 'Histogram'].indexOf(type) < 0) {
      throw new Error('Type must be Counter or Histogram');
    }
    if (typeof this.statistics[name] === 'undefined') {
      this.statistics[name] = await this.container.get(type);
      this.statistics[name].setName('litsor_' + name);
      this.statistics[name].setHelp(help);
    }
    return this.statistics[name];
  }

  get(name) {
    return this.statistics[name] || null;
  }

  export() {
    return Object.keys(this.statistics).map(key => this.statistics[key].export()).join('\n');
  }
}

Statistics.require = ['Container'];
Statistics.singleton = true;

module.exports = Statistics;
