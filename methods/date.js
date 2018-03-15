'use strict';

const moment = require('moment-timezone');

module.exports = {
  name: 'Date',
  description: 'Get current date',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      format: {
        name: 'Date format',
        type: 'string',
        minLength: 1
      },
      timezone: {
        name: 'Timezone',
        type: 'string',
        enum: moment.tz.names()
      }
    },
    required: [],
    additionalProperties: false
  },

  outputSchema: () => {
    return {
      type: 'string'
    };
  },

  defaults: {
    format: 'YYYY-MM-DD'
  },

  requires: [],

  tests: [{
    name: 'Can get current date',
    input: {},
    output: () => {
      return moment().format('YYYY-MM-DD');
    }
  }, {
    name: 'Can get current time in UTC',
    input: {
      format: 'HH:mm'
    },
    output: () => {
      return moment().tz('UTC').format('HH:mm');
    }
  }, {
    name: 'Can get current time in Paris',
    input: {
      format: 'HH:mm'
    },
    output: () => {
      return moment().tz('Europe/Paris').format('HH:mm');
    }
  }, {
    name: 'Can get unix timestamp',
    input: {
      format: 'X'
    },
    output: timestamp => {
      const now = ~~(new Date() / 1e3);
      return parseInt(timestamp, 10) === now || parseInt(timestamp, 10) + 1 === now;
    }
  }],

  execute: async ({format, timezone}) => {
    const date = moment();
    if (timezone) {
      date.tz(timezone);
    }
    return date.format(format);
  }
};
