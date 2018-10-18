'use strict';

module.exports = {
  id: '>=',
  title: '>=',
  description: 'Greather than or equal',
  isBinary: true,
  cache: Infinity,

  inputSchema: {},

  binary: (left, right) => left >= right
};
