'use strict';

const moment = require('moment');

module.exports = {
  title: 'From timestamp',
  description: 'Convert unix timestamp to date',

  inputSchema: {
    type: 'integer'
  },

  unary: input => {
    return moment.unix(input).toISOString();
  }
};
