'use strict';

module.exports = {
  tests: [{
    can: 'filter list',
    left: [{
      name: 'Alice',
      age: 23
    }, {
      name: 'Bob',
      age: 34
    }],
    right: {
      name: 'Alice'
    },
    output: [{
      name: 'Alice',
      age: 23
    }]
  }]
};
