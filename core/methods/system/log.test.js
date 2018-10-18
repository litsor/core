'use strict';

module.exports = {
  mockups: {
    Log: {
      log(_) {}
    }
  },

  tests: [{
    can: 'write to log',
    input: {
      severity: 'debug',
      message: 'Test'
    }
  }]
};
