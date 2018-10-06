'use strict';

module.exports = {
  name: 'Difference',
  description: 'Calculate the difference between two arrays',

  leftSchema: {type: 'array'},
  rightSchema: {type: 'array'},

  binary: async (left, right) => left.filter(item => right.indexOf(item) < 0)
};
