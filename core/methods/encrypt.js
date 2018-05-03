'use strict';

module.exports = {
  title: 'Encrypt',
  description: 'Encrypt data',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      input: {
        title: 'Input data'
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
    title: 'Can encrypt data',
    input: {
      input: 'test'
    },
    output: 'cipher'
  }],

  execute: async ({input}, {Encrypt}) => {
    return Encrypt.encrypt(input);
  }
};
