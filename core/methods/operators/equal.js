'use strict';

module.exports = {
  id: '==',
  title: 'Equals',
  description: 'Check if left operand equals right operand',

  leftSchema: {
    title: 'Left operand'
  },
  rightSchema: {
    title: 'Right operand'
  },

  binary: (left, right) => left === right
};
