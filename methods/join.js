'use strict';

module.exports = {
  name: 'join',
  description: 'Join array parts into single string',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      separator: {
        name: 'Separator',
        type: 'string'
      },
      input: {
        name: 'Input array',
        type: 'array',
        items: {
          name: 'Element',
          type: 'string'
        }
      }
    },
    required: ['input'],
    additionalProperties: false
  },

  outputSchema: () => {
    return {type: 'string'};
  },

  requires: [],

  tests: [{
    name: 'Without separator',
    input: {
      input: ['first', 'second']
    },
    inputSchema: {
      type: 'object',
      properites: {
        input: {type: 'array'}
      }
    },
    output: 'firstsecond',
    outputSchema: {
      type: 'string'
    }
  }, {
    name: 'With separator',
    input: {
      input: ['first', 'second'],
      separator: ', '
    },
    inputSchema: {
      type: 'object',
      properites: {
        input: {type: 'array'}
      }
    },
    output: 'first, second',
    outputSchema: {
      type: 'string'
    }
  }],

  execute: ({input, separator}) => {
    return input.join(separator || '');
  }
};
