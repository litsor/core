'use strict';

module.exports = {
  id: 'base64url',
  title: 'Base64url',
  description: 'Encode to base64url',

  inputSchema: {type: 'string'},

  unary: operand => Buffer.from(operand).toString('base64').split('+').join('-').split('/').join('_').split('=').join('')
};
