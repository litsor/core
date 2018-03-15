'use strict';

module.exports = {
  name: 'Encrypt',
  description: 'Encrypt data',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      input: {
        name: 'Input data'
      }
    },
    required: ['input'],
    additionalProperties: false
  },

  outputSchema: () => {
    return {
      type: 'string'
    };
  },

  requires: ['Encrypt'],

  mockups: {
    Encrypt: {
      encrypt() {
        return 'cipher';
      }
    }
  },

  tests: [{
    name: 'Can encrypt data',
    input: {
      input: 'test'
    },
    output: 'cipher'
  }],

  execute: async ({input}, {Encrypt}) => {
    return Encrypt.encrypt(input);
  }
};
