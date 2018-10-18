'use strict';

module.exports = {
  mockups: {
    ScriptsManager: {
      get: () => {
        return {
          run() {
            return 'test';
          }
        };
      }
    }
  },

  tests: [{
    can: 'run a script',
    left: {},
    right: 'Test',
    output: 'test'
  }],
};
