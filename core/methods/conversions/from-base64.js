'use strict';

module.exports = {
  title: 'From base64',
  description: 'Parse base64 encoded string',

  inputSchema: {type: 'string'},

  unary: operand => Buffer.from(operand, 'base64').toString()
};
