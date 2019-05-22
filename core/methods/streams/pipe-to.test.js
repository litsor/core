'use strict';

module.exports = {
  mockups: {
    Streams: {
      getStream() {
        return {
          pipe() {}
        };
      }
    }
  },
  tests: [{
    can: 'pipe stream',
    left: 'MTIz',
    right: 'MTI0',
    output: null
  }]
};
