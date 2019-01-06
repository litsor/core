'use strict';

class Counter {
  constructor() {
    this.data = {};
  }

  setName(name) {
    this.name = name;
  }

  setHelp(help) {
    this.help = help;
  }

  count(labels = {}) {
    const labelSpec = Object.keys(labels).reduce((spec, key) => [...spec, `${key}="${labels[key]}"`], []).sort().join(',');
    if (typeof this.data[labelSpec] === 'undefined') {
      this.data[labelSpec] = 0;
    }
    ++this.data[labelSpec];
  }

  export() {
    const lines = [
      `# HELP ${this.name} ${this.help}`,
      `# TYPE ${this.name} counter`
    ];
    Object.keys(this.data).forEach(labelSpec => {
      const value = this.data[labelSpec];
      lines.push(`${this.name}${labelSpec ? '{' + labelSpec + '}' : ''} ${value}`);
    });
    return lines.join('\n');
  }
}

Counter.require = [];

module.exports = Counter;
