'use strict';

module.exports = {
  name: 'Intersect',
  description: 'Intersection between two lists',

  leftSchema: {type: 'array'},
  rightSchema: {type: 'array'},

  binary: async (left, right) => left.toSet().intersect(right.toSet()).toList()
};
