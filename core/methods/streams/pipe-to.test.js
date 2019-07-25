'use strict';

module.exports = {
  mockups: {
    Streams: {
      getStream() {
        return {
          pipe() {},
          on(event, callback) {
            if (event === 'finish') {
              setImmediate(callback);
            }
          }
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
