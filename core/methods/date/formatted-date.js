'use strict';

const moment = require('moment-timezone');

module.exports = {
  title: 'Formatted date',
  description: 'Format date',

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
    required: ['format'],
    additionalProperties: false
  },

  unary: input => {
    if (typeof input !== 'object') {
      throw new Error('Input for formattedDate must be an object');
    }
    input = input.toJS();
    input.date = input.date ? moment(input.date) : moment();
    input.timezone = input.timezone || 'UTC';
    return input.date.tz(input.timezone).format(input.format);
  }
};
