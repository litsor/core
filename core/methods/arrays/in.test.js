'use strict';

module.exports = {
  tests: [{
    can: 'detect that a is in [a,b,c]',
    left: 'a',
    right: ['a', 'b', 'c'],
    output: true
  }, {
    can: 'detect that d is not in [a,b,c]',
    left: 'd',
    right: ['a', 'b', 'c'],
    output: false
  }]
};
