'use strict';

const {randomBytes} = require('crypto');

module.exports = {
  id: 'secureToken',
  title: 'Secure token',
  description: 'Generate a random security token',
  isUnary: true,
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      size: {
        title: 'Token size in bits',
        type: 'integer',
        minimum: 40,
        maximum: 1024
      },
      encoding: {
        title: 'Encoding',
        type: 'string',
        enum: ['base64', 'hex']
      }
    },
    required: [],
    additionalProperties: false
  },

  outputSchema: () => {
    return {
      type: 'string'
    };
  },

  defaults: {
    size: 256,
    encoding: 'base64'
  },

  requires: [],

  tests: [{
    title: 'Can generate token in base64',
    input: {
      size: 100
    },
    output: str => str.length === 20
  }, {
    title: 'Can generate token in hex',
    input: {
      encoding: 'hex'
    },
    output: str => str.length === 64
  }],

  unary: async size => {
    return randomBytes(Math.ceil(size / 8)).toString('base64');
  }
};
