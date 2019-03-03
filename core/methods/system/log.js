'use strict';

module.exports = {
  title: 'log',
  description: 'Log data',

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

  defaults: {
    _output: null
  },

  requires: ['Log'],

  unary: (input, {Log}, context) => {
    const {severity, message} = input.toJS();
    Log.log({severity, message, correlationId: context.correlationId});
  }
};
