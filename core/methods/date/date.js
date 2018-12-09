'use strict';

const moment = require('moment-timezone');

module.exports = {
  title: 'Date',
  description: 'Get current date',

  inputSchema: {
    type: 'object',
    properties: {
      format: {
        title: 'Date format',
        type: 'string',
        minLength: 1
      },
      timezone: {
        title: 'Timezone',
        type: 'string',
        enum: moment.tz.names()
      },
      date: {
        title: 'Date',
        type: 'string'
      }
    },
    required: [],
    additionalProperties: false
  },

  defaults: {},

  unary: async input => {
    const date = moment.tz(input.date, input.format, true, input.timezone || 'UTC');
    if (date.isValid()) {
      return date.toISOString();
    }
    return false;
  }
};
