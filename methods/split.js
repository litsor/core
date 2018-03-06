'use strict';

module.exports = {
  name: 'split',
  description: 'Split string on separator',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      input: {
        name: 'Input string',
        type: 'string'
      },
      separator: {
        name: 'Separator',
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
    name: 'Split string',
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

  execute: ({input, separator}) => {
    return input.split(separator);
  }
};
