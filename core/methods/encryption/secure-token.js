'use strict';

const {randomBytes} = require('crypto');

module.exports = {
  title: 'Secure token',
  description: 'Generate a random security token',

  inputSchema: {
    title: 'Bitsize',
    type: 'integer'
  },

  unary: async size => {
    return randomBytes(Math.ceil(size / 8)).toString('base64');
  }
};
