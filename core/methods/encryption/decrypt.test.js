'use strict';

module.exports = {
  mockups: {
    Encrypt: {
      decrypt() {
        return 'original';
      }
    }
  },

  tests: [{
    can: 'decrypt data',
    input: 'cipher',
    output: 'original'
  }]
};
