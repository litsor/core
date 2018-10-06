'use strict';

module.exports = {
  title: 'split',
  description: 'Split string on separator',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      input: {
        title: 'Input string',
        type: 'string'
      },
      separator: {
        title: 'Separator',
        type: 'string'
      }
    },
    required: ['input', 'separator'],
    additionalProperties: false
  },

  outputSchema: () => {
    return {
      type: 'array',
      items: {
        type: 'string'
      }
    };
  },

  requires: [],

  tests: [{
    title: 'Split string',
    input: {
      input: 'first, second',
      separator: ', '
    },
    inputSchema: {
      type: 'string'
    },
    output: ['first', 'second'],
    outputSchema: {
      type: 'array',
      items: {
        type: 'string'
      }
    }
  }],

  binary: (input, separator) => {
    return input.split(separator);
  }
};
