'use strict';

module.exports = {
  tests: [{
    can: 'test valid condition',
    left: true,
    right: true,
    output: true
  }, {
    can: 'test invalid condition',
    left: true,
    right: false,
    output: false
  }, {
    can: 'return null when left operand is false',
    left: false,
    right: true,
    output: null
  }]
};
