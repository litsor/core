'use strict';

module.exports = {
  id: '/',
  title: '/',
  description: 'Divide',
  isBinary: true,
  cache: Infinity,

  inputSchema: {},

  requires: [],

  tests: [],

  binary: (left, right) => left / right
};
