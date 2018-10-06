'use strict';

module.exports = {
  title: 'From JSON',
  description: 'Parse JSON encoded string',

  inputSchema: {type: 'string'},

  unary: operand => JSON.parse(operand)
};
