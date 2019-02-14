'use strict';

module.exports = {
  id: '==',
  title: 'Equals',
  description: 'Check if left operand equals right operand',

  leftSchema: {},
  rightSchema: {},

  binary: (left, right) => left === right
};
