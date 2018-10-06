'use strict';

module.exports = {
  title: 'Base64',
  description: 'Encode to base64',

  inputSchema: {type: 'string'},

  unary: operand => Buffer.from(operand).toString('base64')
};
