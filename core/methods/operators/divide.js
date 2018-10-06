'use strict';

module.exports = {
  id: '/',
  title: 'Division',
  description: 'Divide left operand by right operand',

  leftSchema: {
    title: 'Input',
    type: 'number'
  },

  rightSchema: {
    title: 'Divider',
    type: 'number'
  },

  binary: (left, right) => left / right
};
