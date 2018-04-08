'use strict';

module.exports = {
  title: 'Copy',
  description: 'Copy variable',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      input: {
        title: 'Input variable'
      }
    },
    required: ['input']
  },

  outputSchema: inputSchema => {
    return inputSchema.properties.input || {};
  },

  requires: [],

  tests: [{
    title: 'Copy variable',
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
