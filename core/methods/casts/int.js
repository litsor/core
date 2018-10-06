'use strict';

module.exports = {
  title: 'Cast to integer',
  description: 'Convert string to integer',

  inputSchema: {
    type: 'string',
    pattern: '^-?(0-9]+(e[0-9]+)?$'
  },

  unary: input => parseInt(input, 10)
};
