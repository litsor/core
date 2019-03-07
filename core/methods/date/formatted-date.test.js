'use strict';

const moment = require('moment-timezone');

module.exports = {
  tests: [{
    can: 'format current date',
    input: {
      format: 'YYYY'
    },
    output: value => value === moment().format('YYYY')
  }, {
    can: 'format given date',
    input: {
      date: '2018-02-12T12:00:00Z',
      format: 'HH:mm'
    },
    output: '12:00'
  }, {
    can: 'format given date in different timezone',
    input: {
      date: '2018-02-12T12:00:00Z',
      format: 'HH:mm',
      timezone: 'Europe/Amsterdam',
    },
    output: '13:00'
  }]
};
