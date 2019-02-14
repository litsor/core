'use strict';

module.exports = {
  id: '>=',
  title: '>=',
  description: 'Greather than or equal',
  isBinary: true,
  cache: Infinity,

  leftSchema: {},
  rightSchema: {},

  binary: (left, right) => left >= right
};
