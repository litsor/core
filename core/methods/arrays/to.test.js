'use strict';

module.exports = {
  tests: [{
    can: 'calculate values from 1 to 5',
    left: 1,
    right: 5,
    output: [1, 2, 3, 4, 5]
  }, {
    can: 'return empty array for invalid range',
    left: 5,
    right: 1,
    output: []
  }]
};
