'use strict';

module.exports = {
  title: 'Map',
  description: 'Process each item in an array',
  lazy: true,

  leftSchema: {type: 'array'},
  rightSchema: {title: 'Callback'},

  requires: ['Immutable'],

  binary: async (left, right, {Immutable}, context) => {
    const items = await left();
    if (!Immutable.isIndexed(items)) {
      throw new Error('Left operand must be an array');
    }
    if (!context.methodState) {
      context.methodState = {
        i: 0,
        output: Immutable.fromJS([])
      };
    }
    const base = Immutable.isKeyed(context.data) ? context.data : Immutable.fromJS({});
    for (let i = context.methodState.i; i < items.size; ++i) {
      const value = await right(base.setIn(['item'], items.get(i)));
      context.methodState.output = context.methodState.output.push(Immutable.fromJS(value));
    }
    return context.methodState.output;
  }
};
