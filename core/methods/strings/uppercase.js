'use strict';

module.exports = {
  title: 'Uppercase',
  description: 'Convert string to uppercase',
  inputSchema: {type: 'string'},
  unary: input => input.toUpperCase()
};
