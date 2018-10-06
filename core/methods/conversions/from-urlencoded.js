'use strict';

module.exports = {
  title: 'Url decode',
  description: 'Url decode string',

  inputSchema: {type: 'string'},

  unary: operand => decodeURIComponent(operand)
};
