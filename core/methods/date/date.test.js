'use strict';

const moment = require('moment-timezone');

module.exports = {
  tests: [{
    can: 'get date with format YYYY and in UTC',
    input: {
      date: '2018',
      format: 'YYYY'
    },
    output: value => value === moment.tz('2018', 'YYYY').toISOString()
  }, {
    can: 'get date with format YYYY-MM-DD in Amsterdam',
    input: {
      date: '2018-02-12',
      format: 'YYYY-MM-DD'
    },
    output: value => value === moment.tz('2018-02-12', 'YYYY-MM-DD').toISOString()
  }, {
    can: 'get false when input is incorrect',
    input: {
      format: 'YYYY-MM-DD'
    },
    output: false
  }]
};
