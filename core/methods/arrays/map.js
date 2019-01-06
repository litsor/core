'use strict';

module.exports = {
  title: 'Map',
  description: 'Process each item in an array',
  lazy: true,

  leftSchema: {type: 'array'},
  rightSchema: {title: 'Callback'},

  binary: async (left, right, {}, context) => {
    const items = await left();
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
      const value = await right({
        ...context.data,
        item: items[i]
      });
      context.methodState.output.push(value);
    }
    return context.methodState.output;
  }
};
