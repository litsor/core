'use strict';

const moment = require('moment');

module.exports = {
  title: 'Seconds to',
  description: 'Calculate seconds to given date',

  leftSchema: {
    type: 'string'
  },

  rightSchema: {
    type: 'string'
  },

  requires: [],

  binary: (from, to) => Math.round(moment(to).diff(moment(from)) / 1e3)
};
