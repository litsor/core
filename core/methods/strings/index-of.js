'use strict';

module.exports = {
  name: 'Index of',
  leftSchema: {type: 'string'},
  rightSchema: {type: 'string'},
  binary: (left, right) => left.indexOf(right)
};
