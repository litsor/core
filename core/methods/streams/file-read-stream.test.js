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
    can: 'create read stream',
    input: '/etc/hosts',
    output: 'MTIzCg=='
  }]
};
