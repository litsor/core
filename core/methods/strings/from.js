'use strict';

module.exports = {
  title: 'From',
  description: 'Get substring from right operand to end of string',

  inputSchema: {},

  binary: (string, from) => string.substring(from)
};
