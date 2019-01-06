'use strict';

const {clone} = require('lodash');

class Histogram {
  constructor() {
    this.initBuckets();
  }

  setName(name) {
    this.name = name;
  }

  setHelp(help) {
    this.help = help;
  }

  initBuckets(buckets = [0.001, 0.01, 0.1, 0.5, 1, 5, 10, 30, 60, Infinity]) {
    this.buckets = buckets.sort();
    this.count = 0;
    this.sum = 0;
    this.emptyData = buckets.reduce((output, value) => ({...output, [String(value)]: 0}), {});
    this.data = {};
  }

  add(value, labels = {}) {
    const labelSpec = Object.keys(labels).reduce((spec, key) => [...spec, `${key}="${labels[key]}"`], []).sort().join(',');
    if (typeof this.data[labelSpec] === 'undefined') {
      this.data[labelSpec] = clone(this.emptyData);
    }
    let buckets = [];
    for (let i = 0; i < this.buckets.length; ++i) {
      if (value <= this.buckets[i]) {
        buckets.push(String(this.buckets[i]));
      }
    }
    buckets.forEach(bucket => {
      ++this.data[labelSpec][bucket];
    });
    this.sum += value;
    ++this.count;
  }

  export() {
    const lines = [
      `# HELP ${this.name} ${this.help}`,
      `# TYPE ${this.name} histogram`
    ];
    Object.keys(this.data).forEach(labelSpec => {
      this.buckets.map(value => String(value)).forEach(bucket => {
        const value = this.data[labelSpec][bucket];
        const le = bucket === 'Infinity' ? '+Inf' : bucket;
        lines.push(`${this.name}_bucket{le="${le}"${labelSpec ? ',' + labelSpec : ''}} ${value}`);
      });
    });
    lines.push(`${this.name}_count ${this.count}`);
    lines.push(`${this.name}_sum ${this.sum}`);
    return lines.join('\n');
  }
}

Histogram.require = [];

module.exports = Histogram;
