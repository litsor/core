'use strict';

module.exports = {
  tests: [{
    can: 'reduce list',
    left: [1, 2, 3],
    right: ({previous, current}) => (previous || 0) + current,
    output: 6
  }]
};
