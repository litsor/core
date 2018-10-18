'use strict';

module.exports = {
  tests: [{
    can: 'return right operand if left operand is true',
    left: true,
    right: 'test',
    output: 'test'
  }, {
    can: 'return context if left operand is false',
    left: false,
    right: 'test',
    output: {}
  }]
};
