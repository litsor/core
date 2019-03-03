'use strict';

module.exports = {
  title: 'Reduce',
  description: 'Reduce list to single value',
  lazy: true,

  leftSchema: {type: 'array'},
  rightSchema: {title: 'Reducer'},

  requires: ['Immutable'],

  binary: async (input, reducer, {Immutable}, context) => {
    const items = await input();
    if (!Immutable.isIndexed(items)) {
      throw new Error('Left operand must be an array');
    }
    if (!context.methodState) {
      context.methodState = {
        i: 0,
        output: null
      };
    }
    const base = Immutable.isKeyed(context.data) ? context.data : Immutable.fromJS({});
    for (let i = context.methodState.i; i < items.size; ++i) {
      context.methodState.output = await reducer(base
        .setIn(['previous'], context.methodState.output)
        .setIn(['current'], items.get(i)), context);
    }
    return context.methodState.output;
  }
};
