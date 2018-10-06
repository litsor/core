'use strict';

module.exports = {
  id: '*',
  title: 'Multiply',
  description: 'Multiply left operand by right operand',

  leftSchema: {type: 'number'},
  rightSchema: {type: 'number'},

  binary: (left, right) => left * right
};
