'use strict';

module.exports = {
  tests: [{
    can: 'get matches',
    left: 'Hello world!',
    right: '[\\w]+',
    output: ['Hello', 'world']
  }]
};
