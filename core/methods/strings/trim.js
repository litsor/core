'use strict';

module.exports = {
  title: 'Trim',
  description: 'Trim whitespace from start and end of string',

  inputSchema: {type: 'string'},

  unary: input => input.trim()
};
