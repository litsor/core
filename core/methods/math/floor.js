'use strict';

module.exports = {
  title: 'Floor',
  description: 'Calculate floor',

  inputSchema: {type: 'number'},

  requires: [],

  unary: input => Math.floor(input)
};
