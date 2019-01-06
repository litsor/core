'use strict';

module.exports = {
  title: 'Filter',
  description: 'Filter array on callback',
  lazy: true,

  leftSchema: {type: 'array'},
  rightSchema: {title: 'Filter function'},

  binary: async (input, filter, {}, context) => {
    let output = [];
    const items = await input();
    if (!Array.isArray(items)) {
      throw new Error('Left operand must be an array');
    }
    if (!context.methodState) {
      context.methodState = {
        i: 0,
        output: []
      };
    }
    for (let i = context.methodState.i; i < items.length; ++i) {
      if (typeof items[i] === 'undefined') {
        continue;
      }
      const keep = await filter({
        ...context.data,
        item: items[i]
      });
      if (keep) {
        context.methodState.output.push(items[i]);
      }
    }
    return context.methodState.output;
  }
};
