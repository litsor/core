'use strict';

module.exports = {
  tests: [{
    can: 'reduce list',
    left: [1, 2, 3],
    right: data => {
      return (data.getIn(['previous']) || 0) + data.getIn(['current']);
    },
    output: 6
  }]
};
