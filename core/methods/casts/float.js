'use strict';

module.exports = {
  title: 'Cast to float',
  description: 'Convert string to float',

  inputSchema: {
    type: 'string',
    pattern: '^-?((0-9]+|[0-9]*\\.[0-9]+)(e[0-9]+)?$'
  },

  unary: input => parseFloat(input, 10)
};
