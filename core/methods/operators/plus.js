'use strict';

module.exports = {
  id: '+',
  title: '+',
  description: 'Plus',
  isBinary: true,
  cache: Infinity,

  inputSchema: {},

  binary: (left, right) => left + right
};
