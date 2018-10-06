'use strict';

module.exports = {
  title: 'Then',
  description: 'Then',
  cache: Infinity,
  lazy: true,

  leftSchema: {
    title: 'Condition'
  },

  rightSchema: {
    title: 'Expression'
  },

  requires: [],

  tests: [{
    left: () => true,
    right: () => 'test',
    output: 'test'
  }, {
    left: () => false,
    right: () => 'test',
    output: {}
  }],

  binary: async (left, right, dependencies, context) => {
    if (await left()) {
      return right();
    }
    return context.data;
  }
};
