'use strict';

module.exports = {
  title: 'Starts with',
  description: 'Check if string from left operand starts with right operand',

  leftSchema: {type: 'string'},
  rightSchema: {type: 'string'},

  binary: (left, right) => left.startsWith(right)
};
