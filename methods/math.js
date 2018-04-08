'use strict';

const MathJS = require('mathjs');

module.exports = {
  title: 'Math',
  description: 'Calculate mathematical expression',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      formula: {
        title: 'Formula',
        type: 'string'
      }
    },
    required: ['formula'],
    additionalProperties: {
      title: 'Render variables'
    }
  },

  outputSchema: () => {
    return {
      type: 'number'
    };
  },

  requires: [],

  tests: [{
    title: 'Execute basic formula',
    input: {
      formula: '1 + 1'
    },
    outputSchema: {type: 'number'},
    output: 2
  }, {
    title: 'Use variable',
    input: {
      formula: '1 + a',
      a: 3
    },
    outputSchema: {type: 'number'},
    output: 4
  }, {
    title: 'Use function',
    input: {
      formula: '1 + sqrt(a)',
      a: 3
    },
    outputSchema: {type: 'number'},
    output: num => num > 2.73 && num < 2.74
  }],

  execute: ({formula, ...variables}) => {
    return MathJS.eval(formula, variables);
  }
};
