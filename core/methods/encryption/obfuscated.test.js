'use strict';

module.exports = {
  mockups: {
    Encrypt: {
      hash(data) {
        return 'dummy hash';
      }
    }
  },

  tests: [{
    can: 'Can obfuscate string',
    input: '123',
    output: 'w9HI--_y'
  }],
};
