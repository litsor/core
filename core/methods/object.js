'use strict';

module.exports = {
  title: 'Object',
  description: 'Compose new object from provided properties',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: {
      title: 'Object properties'
    }
  },

  outputSchema: () => {
    return {
      type: 'object'
    };
  },

  requires: [],

  tests: [{
    title: 'Create new object',
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
