'use strict';

module.exports = {
  tests: [{
    can: 'get seconds to date',
    left: '2018-04-02T12:00:00.000Z',
    right: '2018-04-02T13:00:00.000Z',
    output: 3600
  }, {
    can: 'give negative results if right operand is before left',
    left: '2018-04-02T12:00:00.000Z',
    right: '2018-04-02T11:30:00.000Z',
    output: -1800
  }]
};
