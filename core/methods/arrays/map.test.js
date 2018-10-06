'use strict';

module.exports = {
  tests: [{
    can: 'map list',
    left: [1, 2, 3],
    right: ({item}) => item + 1,
    output: [2, 3, 4]
  }]
};
