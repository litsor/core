'use strict';

const {$$asyncIterator} = require('iterall');

class SubscriptionIterator {
  constructor({iterator, resolver, field, variables, context, ast}) {
    this.iterator = iterator;
    this.running = true;
    this.resolver = resolver;
    this.field = field;
    this.variables = variables;
    this.context = context;
    this.ast = ast;
  }

  async next() {
    while (this.running) {
      const {value} = await this.iterator.next();
      // Check filters.
      if (typeof value !== 'object' || value === null) {
        break;
      }
      if (this.variables.id && this.variables.id !== value.id) {
        break;
      }
      const output = await this.resolver({}, this.variables, this.context, this.ast);
      return {
        value: {
          [this.field]: output
        }
      };
    }
    return {done: true};
  }

  async throw(e) {
    this.running = false;
  }

  async return() {
    this.running = false;
    return  {done: true};
  }

  [$$asyncIterator]() {
    return this;
  }
}

module.exports = SubscriptionIterator;
