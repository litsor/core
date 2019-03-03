'use strict';

module.exports = {
  tests: [{
    can: 'return left operand when true',
    left: 'left',
    right: 'right',
    output: 'left'
  }, {
    can: 'return right operand when left operand is false',
    left: false,
    right: 'right',
    output: 'right'
  }, {
    can: 'return right operand when left operand is 0',
    left: 0,
    right: 'right',
    output: 'right'
  }, {
    can: 'return right operand when left operand is null',
    left: null,
    right: 0,
    output: 0
  }]
};
