'use strict';

module.exports = {
  title: 'Sort',
  description: 'Sort list',

  inputSchema: {
    type: 'array'
  },

  requires: [],

  unary: input => input.sort()
};
