'use strict';

module.exports = {
  title: 'From',
  description: 'Get substring from right operand to end of string',

  leftSchema: {type: 'string'},
  rightSchema: {type: 'integer', minimum: 0},

  binary: (string, from) => string.substring(from)
};
