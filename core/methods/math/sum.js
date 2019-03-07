'use strict';

module.exports = {
  title: 'Sum',
  description: 'Calculate sum of array values',

  inputSchema: {
    type: 'array',
    items: {
      title: 'Element',
      type: 'number'
    }
  },

  requires: [],

  unary: input => input.toJS().reduce((a, b) => a + b, 0)
};
