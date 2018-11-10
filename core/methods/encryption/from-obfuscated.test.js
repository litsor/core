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
    can: 'Can decrypt obfuscated string',
    input: 'w9HI--_y',
    output: '123'
  }, {
    can: 'Will return null when input is too short',
    input: 'w9HI',
    output: null
  }, {
    can: 'Will return null when checksum is wrong',
    input: 'ThisIsATest',
    output: null
  }],
};
