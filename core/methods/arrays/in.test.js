'use strict';

module.exports = {
  tests: [{
    can: 'detect that item is in list',
    left: 'b',
    right: ['a', 'b', 'c'],
    output: true
  }, {
    can: 'detect that item is not in list',
    left: 'd',
    right: ['a', 'b', 'c'],
    output: false
  }]
};
