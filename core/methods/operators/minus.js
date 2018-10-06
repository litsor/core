'use strict';

module.exports = {
  id: '-',
  title: 'Minus',
  description: 'Subtract right operand from left operand',

  leftSchema: {type: 'number'},
  rightSchema: {type: 'number'},

  binary: (left, right) => left - right
};
