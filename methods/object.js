'use strict';

module.exports = {
  name: 'Object',
  description: 'Compose new object from provided properties',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: {
      name: 'Object properties'
    }
  },

  outputSchema: () => {
    return {
      type: 'object'
    };
  },

  requires: [],

  tests: [{
    name: 'Create new object',
    input: {
      foo: 'bar',
      bar: 'baz'
    },
    outputSchema: {type: 'object'},
    output: {
      foo: 'bar',
      bar: 'baz'
    }
  }],

  execute: input => {
    return input;
  }
};
