'use strict';

module.exports = {
  id: '!=',
  title: '!=',
  description: 'Not equal',
  isBinary: true,
  cache: Infinity,

  inputSchema: {},

  binary: (left, right) => left !== right
};
