'use strict';

module.exports = {
  title: 'Url encode',
  description: 'Url encode',

  inputSchema: {type: 'string'},

  unary: operand => encodeURIComponent(operand)
};
