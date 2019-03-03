'use strict';

module.exports = {
  title: 'Filter',
  description: 'Filter array on callback',
  lazy: true,

  leftSchema: {type: 'array'},
  rightSchema: {title: 'Filter function'},

  requires: ['Immutable'],

  binary: async (input, filter, {Immutable}, context) => {
    const items = await input();
    if (!context.methodState) {
      context.methodState = {
        i: 0,
        output: Immutable.fromJS([])
      };
    }
    const base = Immutable.isKeyed(context.data) ? context.data : Immutable.fromJS({});
    for (let i = context.methodState.i; i < items.size; ++i) {
      const keep = await filter(base.setIn(['item'], items.get(i)));
      if (keep) {
        context.methodState.output = context.methodState.output.push(items.get(i));
      }
    }
    return context.methodState.output;
  }
};
