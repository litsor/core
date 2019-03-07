'use strict';

module.exports = {
  tests: [{
    can: 'get 1 day before date',
    left: '1 day',
    right: '2018-01-01T12:00:00Z',
    output: '2017-12-31T12:00:00.000Z'
  }, {
    can: 'use shorthands',
    left: '2 M',
    right: '2018-01-01T12:00:00Z',
    output: '2017-11-01T12:00:00.000Z'
  }]
};
