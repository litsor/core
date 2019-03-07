'use strict';

module.exports = {
  title: 'Reverse',
  description: 'Reverse list',

  inputSchema: {
    type: 'array'
  },

  requires: [],

  unary: input => input.reverse()
};
