'use strict';

module.exports = {
  title: 'Debug',
  description: 'Log for debug purposes',

  requires: ['Log'],

  mockups: {
    Log: {
      log(_) {}
    }
  },

  tests: [{
    input: 'Test'
  }],

  unary: (message, {Log}, context) => {
    Log.log({severity: 'debug', message: JSON.stringify(message), correlationId: context.correlationId});
  }
};
