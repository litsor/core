'use strict';

module.exports = {
  title: 'Lowercase',
  description: 'Convert string to lowercase',
  inputSchema: {type: 'string'},
  unary: input => input.toLowerCase()
};
