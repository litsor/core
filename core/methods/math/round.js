'use strict';

module.exports = {
  title: 'Round',
  description: 'Round number',
  isUnary: true,
  cache: Infinity,

  inputSchema: {},

  unary: operand => Math.round(operand)
};
