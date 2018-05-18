'use strict';

module.exports = {
  title: 'log',
  description: 'Log data',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      severity: {
        title: 'Severity',
        type: 'string',
        enum: ['debug', 'info', 'warning', 'error', 'critical']
      },
      message: {
        title: 'Message',
        type: 'string'
      }
    },
    additionalProperties: false
  },

  outputSchema: () => {
    return {};
  },

  defaults: {
    _output: null
  },

  requires: ['Log'],

  mockups: {
    Log: {
      log(_) {}
    }
  },

  tests: [{
    input: {
      severity: 'debug',
      message: 'Test'
    }
  }],

  execute: ({severity, message}, {Log}, correlationId) => {
    Log.log({severity, message, correlationId});
  }
};
