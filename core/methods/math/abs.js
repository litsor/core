'use strict';

module.exports = {
  title: 'Absolute',
  description: 'Calculate absolute value',

  inputSchema: {type: 'number'},

  requires: [],

  unary: input => Math.abs(input)
};
