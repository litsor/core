'use strict';

const moment = require('moment-timezone');

module.exports = {
  title: 'End of',
  description: 'Go to end of period',

  leftSchema: {
    type: 'string'
  },

  rightSchema: {
    type: 'string',
    enum: ['year', 'month', 'quarter', 'week', 'isoWeek', 'day', 'hour', 'minute', 'second']
  },

  requires: [],

  binary: (date, period) => moment.tz(date, 'UTC').endOf(period).toISOString()
};
