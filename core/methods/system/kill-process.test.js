'use strict';

module.exports = {
  mockups: {
    ScriptsManager: {
      get() {
        return {
          kill() {}
        }
      }
    }
  },

  tests: [{
    can: 'kill process',
    input: {
      scriptId: 'TestScript',
      processId: '123'
    },
    output: null
  }]
};
