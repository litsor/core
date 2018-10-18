'use strict';

module.exports = {
  title: 'Starts with',
  description: 'Check if string from left operand starts with right operand',

  inputSchema: {},

  binary: (left, right) => left.startsWith(right)
};
