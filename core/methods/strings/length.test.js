'use strict';

module.exports = {
  tests: [{
    can: 'get string length',
    input: 'Test',
    output: 4
  }, {
    can: 'get array length',
    input: ['a', 'b', 'c'],
    output: 3
  }, {
    can: 'return 0 for null',
    input: null,
    output: 0
  }, {
    can: 'return 1 for other types',
    input: true,
    output: 1
  }]
};
