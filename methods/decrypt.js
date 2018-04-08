'use strict';

module.exports = {
  title: 'Decrypt',
  description: 'Decrypt data',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      input: {
        title: 'Input data',
        type: 'string'
      }
    },
    required: ['input'],
    additionalProperties: false
  },

  outputSchema: () => {
    return {};
  },

  requires: ['Encrypt'],

  mockups: {
    Encrypt: {
      decrypt() {
        return 'original';
      }
    }
  },

  tests: [{
    title: 'Can decrypt data',
    input: {
      input: 'cipher'
    },
    output: 'original'
  }],

  execute: async ({input}, {Encrypt}) => {
    return Encrypt.decrypt(input);
  }
};
