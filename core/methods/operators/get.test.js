'use strict';

module.exports = {
  tests: [{
    can: 'get object property',
    left: {foo: 'bar'},
    right: 'foo',
    output: 'bar'
  }, {
    can: 'get array index',
    left: [1, 2, 3],
    right: 1,
    output: 2
  }, {
    can: 'return null for unknown property',
    left: {foo: 'bar'},
    right: 'baz',
    output: null
  }, {
    can: 'return null for unknown index',
    left: [1, 2, 3],
    right: 5,
    output: null
  }, {
    can: 'return null for scalars',
    left: 'test',
    right: 3,
    output: null
  }]
}
