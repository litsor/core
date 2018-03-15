'use strict';

module.exports = {
  name: 'log',
  description: 'Log data',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      input: {
        name: 'Input data'
      }
    },
    additionalProperties: false
  },

  outputSchema: () => {
    return {};
  },

  defaults: {
    input: '/',
    _output: null
  },

  requires: [],

  tests: [],

  execute: ({input}) => {
    console.log(JSON.stringify(input, null, 2));
  }
};
