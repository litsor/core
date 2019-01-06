'use strict';

module.exports = {
  title: 'Reduce',
  description: 'Reduce list to single value',
  lazy: true,

  leftSchema: {type: 'array'},
  rightSchema: {title: 'Reducer'},

  binary: async (input, reducer, {}, context) => {
    const items = await input();
    if (!Array.isArray(items)) {
      throw new Error('Left operand must be an array');
    }
    if (!context.methodState) {
      context.methodState = {
        i: 0,
        output: null
      };
    }
    for (let i = context.methodState.i; i < items.length; ++i) {
      context.methodState.output = await reducer({
        previous: context.methodState.output,
        current: items[i]
      }, context);
    }
    return context.methodState.output;
  }
};
