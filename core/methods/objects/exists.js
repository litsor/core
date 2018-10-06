'use strict';

module.exports = {
  id: 'exists',
  description: 'Check if value exists',
  inputSchema: {
    title: 'Value'
  },
  requires: [],
  tests: [],
  unary: value => typeof value !== 'undefined'
}
