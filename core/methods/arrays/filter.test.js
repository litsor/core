'use strict';

module.exports = {
  tests: [{
    can: 'filter list',
    left: ['a', 'b', 'c'],
    right: ({item}) => item !== 'b',
    output: ['a', 'c']
  }]
};
