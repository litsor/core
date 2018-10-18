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
    if (await left()) {
      return right();
    }
    return context.data;
  }
};
