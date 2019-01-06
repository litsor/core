'use strict';

module.exports = {
  mockups: {
    ScriptsManager: {
      get() {
        return {
          getProcessList() {
            return [{
              processId: '...',
              correlationId: '...',
              runningTime: 123,
              line: 1,
              killed: false
            }];
          }
        }
      }
    }
  },

  tests: [{
    can: 'get processlist',
    input: "ScriptId",
    output: [{
      processId: '...',
      correlationId: '...',
      runningTime: 123,
      line: 1,
      killed: false
    }]
  }]
};
