'use strict';

module.exports = {
  name: 'Union',
  description: 'Merge two lists',

  leftSchema: {type: 'array'},
  rightSchema: {type: 'array'},

  binary: async (left, right) => ([...left, ...right].filter((item, index, array) => array.indexOf(item) === index))
};
