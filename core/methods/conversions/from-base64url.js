'use strict';

module.exports = {
  id: 'fromBase64url',
  title: 'From base64url',
  description: 'Parse base64url encoded string',

  inputSchema: {type: 'string'},

  unary: operand => {
    operand = operand.split('-').join('+').split('_').join('/').split('.').join('');
    return Buffer.from(operand, 'base64').toString();
  }
};
