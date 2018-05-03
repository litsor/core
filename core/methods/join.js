'use strict';

module.exports = {
  title: 'join',
  description: 'Join array parts into single string',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      separator: {
        title: 'Separator',
        type: 'string'
      },
      input: {
        title: 'Input array',
        type: 'array',
        items: {
          title: 'Element',
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
    title: 'Without separator',
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
    title: 'With separator',
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
