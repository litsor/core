'use strict';

module.exports = {
  tests: [{
    can: 'filter collection',
    left: [{
      name: 'Alice',
      age: 23
    }, {
      name: 'Bob',
      age: 34
    }],
    right: {
      filters: {
        name: 'Alice'
      }
    },
    output: {
      count: 1,
      items: [{
        name: 'Alice',
        age: 23
      }]
    }
  }, {
    can: 'sort on string',
    left: [{
      name: 'Alice',
      age: 23
    }, {
      name: 'Bob',
      age: 34
    }],
    right: {
      order: [{
        field: 'name',
        direction: 'DESC'
      }]
    },
    output: {
      count: 2,
      items: [{
        name: 'Bob',
        age: 34
      }, {
        name: 'Alice',
        age: 23
      }]
    }
  }, {
    can: 'sort on number',
    left: [{
      name: 'Alice',
      age: 53
    }, {
      name: 'Bob',
      age: 34
    }],
    right: {
      order: [{
        field: 'age'
      }]
    },
    output: {
      count: 2,
      items: [{
        name: 'Bob',
        age: 34
      }, {
        name: 'Alice',
        age: 53
      }]
    }
  }]
};
