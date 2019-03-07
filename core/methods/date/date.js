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

  unary: input => {
    if (typeof input !== 'object') {
      throw new Error('Input for date must be an object');
    }
    input = input.toJS();
    if (input.date && !input.format) {
      throw new Error('Format is required when converting date');
    }
    input.date = input.date || moment();
    const date = moment.tz(input.date, input.format, input.timezone || 'UTC');
    if (date.isValid()) {
      return date.toISOString();
    }
    return false;
  }
};
