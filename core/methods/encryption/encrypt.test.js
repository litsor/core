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
    can: 'encrypt data',
    input: 'test',
    output: 'cipher'
  }],
};
