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
      }
    },
    required: [],
    additionalProperties: false
  },

  defaults: {
    format: 'YYYY-MM-DD'
  },

  unary: async input => {
    const date = moment();
    if (typeof input === 'object' && input.timezone) {
      date.tz(input.timezone);
    }
    return date.format(typeof input === 'object' ? input.format : input);
  }
};
