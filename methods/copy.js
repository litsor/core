'use strict';

module.exports = {
  name: 'Copy',
  description: 'Copy variable',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      input: {
        name: 'Input variable'
      }
    },
    required: ['input']
  },

  outputSchema: inputSchema => {
    return inputSchema.properties.input || {};
  },

  requires: [],

  tests: [{
    name: 'Copy variable',
    input: {
      input: 'test'
    },
    inputSchema: {
      type: 'object',
      properties: {
        input: {type: 'string'}
      }
    },
    outputSchema: {type: 'string'},
    output: 'test'
  }],

  execute: ({input}) => {
    return input;
  }
};
