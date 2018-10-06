'use strict';

module.exports = {
  mockups: {
    Encrypt: {
      encrypt() {
        return 'cipher';
      }
    }
  },

  tests: [{
    can: 'Can encrypt data',
    input: 'test',
    output: 'cipher'
  }],
};
