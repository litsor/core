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
    title: 'Can decrypt data',
    input: 'cipher',
    output: 'original'
  }]
};
