'use strict';

module.exports = {
  name: 'Filter',
  lazy: true,
  leftSchema: {
    title: 'Input array',
    type: 'array'
  },
  rightSchema: {
    title: 'Filter function'
  },
  requires: [],
  tests: [],
  binary: async (input, filter, {}, context) => {
    let output = [];
    const items = await input();
    for (let i = 0; i < items.length; ++i) {
      if (typeof items[i] === 'undefined') {
        continue;
      }
      const keep = await filter({
        ...context.data,
        item: items[i]
      });
      if (keep) {
        output.push(items[i]);
      }
    }
    return output;
  }
};
