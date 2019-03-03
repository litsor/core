'use strict';

module.exports = {
  name: 'Union',
  description: 'Merge two lists',

  leftSchema: {type: 'array'},
  rightSchema: {type: 'array'},

  binary: async (left, right) => left.toSet().union(right.toSet()).toList()
};
