'use strict';

module.exports = {
  tests: [{
    can: 'get end of month',
    left: '2018-01-01T12:00:00.000Z',
    right: 'month',
    output: '2018-01-31T23:59:59.999Z'
  }]
};
