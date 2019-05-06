'use strict';

module.exports = {
  title: 'Environment variable',
  description: 'Get environment variable',

  inputSchema: {
    title: 'Variable name',
    type: 'string'
  },

  requires: [],

  unary: name => process.env[name]
};
