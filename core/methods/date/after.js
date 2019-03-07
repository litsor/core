'use strict';

const moment = require('moment');

module.exports = {
  title: 'After date',
  description: 'Add interval to date',

  leftSchema: {
    type: 'string',
    pattern: '^\\-?[\\d]+ (ms|milliseconds?|s|seconds?|m|minutes?|h|hours?|d|days?|w|weeks?|M|months?|Q|quarters?|y|years?)$'
  },

  rightSchema: {
    type: 'string'
  },

  requires: [],

  binary: (interval, date) => {
    const [amount, units] = interval.split(' ');
    return moment(date).add(amount, units).toISOString();
  }
};
