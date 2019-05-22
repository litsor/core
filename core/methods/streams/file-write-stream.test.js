'use strict';

module.exports = {
  mockups: {
    Streams: {
      registerStream() {
        return 'MTIzCg==';
      }
    }
  },
  tests: [{
    can: 'create write stream',
    input: '/tmp/test.txt',
    output: 'MTIzCg=='
  }]
};
