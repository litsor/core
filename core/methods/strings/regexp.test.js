'use strict';

module.exports = {
  tests: [{
    can: 'get match',
    left: 'test',
    right: '^[\\w]+$',
    output: ['test']
  }, {
    can: 'return capture groups',
    left: 'test',
    right: '^(..)(..)$',
    output: ['test', 'te', 'st']
  }, {
    can: 'return null when no match found',
    left: 'test',
    right: '^..$',
    output: null
  }, {
    can: 'return first match',
    left: 'test',
    right: '.',
    output: ['t']
  }]
};
