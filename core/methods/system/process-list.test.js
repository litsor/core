'use strict';

module.exports = {
  mockups: {
    ScriptsManager: {
      get() {
        return {
          getProcessList() {
            return [{
              processId: 1,
              correlationId: '...',
              runningTime: 123,
              line: 1
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
      processId: 1,
      correlationId: '...',
      runningTime: 123,
      line: 1
    }]
  }]
};
