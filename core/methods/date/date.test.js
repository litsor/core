'use strict';

const moment = require('moment');

module.exports = {
  tests: [{
    can: 'get current date',
    input: {},
    output: () => {
      return moment().format('YYYY-MM-DD');
    }
  }, {
    can: 'get current time in UTC',
    input: {
      format: 'HH:mm'
    },
    output: () => {
      return moment().tz('UTC').format('HH:mm');
    }
  }, {
    can: 'get current time in Paris',
    input: {
      format: 'HH:mm'
    },
    output: () => {
      return moment().tz('Europe/Paris').format('HH:mm');
    }
  }, {
    can: 'get unix timestamp',
    input: {
      format: 'X'
    },
    output: timestamp => {
      const now = ~~(new Date() / 1e3);
      return parseInt(timestamp, 10) === now || parseInt(timestamp, 10) + 1 === now;
    }
  }]
};
