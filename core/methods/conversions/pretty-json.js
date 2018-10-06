'use strict';

module.exports = {
  title: 'Pretty JSON',
  description: 'Create JSON encoded string with indenting',

  inputSchema: {},

  unary: operand => JSON.stringify(operand, null, 2)
};
