'use strict';

module.exports = {
  mockups: {
    Streams: {
      getStream() {
        return {
          close() {}
        };
      }
    }
  },
  tests: [{
    can: 'close stream',
    input: 'MTIzCg==',
    output: null
  }]
};
