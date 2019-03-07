'use strict';

const moment = require('moment');

module.exports = {
  title: 'Timestamp',
  description: 'Get unix timestamp from date',

  inputSchema: {
    type: 'string'
  },

  unary: input => {
    return moment(input).unix();
  }
};
