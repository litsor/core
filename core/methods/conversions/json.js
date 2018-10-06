'use strict';

module.exports = {
  title: 'JSON',
  description: 'Create JSON encoded string',

  inputSchema: {},

  unary: operand => JSON.stringify(operand)
};
