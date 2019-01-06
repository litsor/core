'use strict';

module.exports = {
  title: 'Then',
  description: 'Then',
  lazy: true,

  leftSchema: {
    title: 'Condition'
  },

  rightSchema: {
    title: 'Expression'
  },

  binary: async (left, right, {}, context) => {
    if (context.methodState === null) {
      context.methodState = {left: await left()};
    }
    if (context.methodState.left) {
      return right();
    }
    return context.data;
  }
};
