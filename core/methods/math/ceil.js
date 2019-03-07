'use strict';

module.exports = {
  title: 'Ceil',
  description: 'Calculate ceil',

  inputSchema: {type: 'number'},

  requires: [],

  unary: input => Math.ceil(input)
};
