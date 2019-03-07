'use strict';

const moment = require('moment-timezone');

module.exports = {
  title: 'Start of',
  description: 'Go to start of period',

  leftSchema: {
    type: 'string'
  },

  rightSchema: {
    type: 'string',
    enum: ['year', 'month', 'quarter', 'week', 'isoWeek', 'day', 'hour', 'minute', 'second']
  },

  requires: [],

  binary: (date, period) => moment.tz(date, 'UTC').startOf(period).toISOString()
};
