'use strict';

module.exports = {
  tests: [{
    can: 'filter list',
    left: ['a', 'b', 'c'],
    right: input => input.getIn(['item']) !== 'b',
    output: ['a', 'c']
  }]
};
