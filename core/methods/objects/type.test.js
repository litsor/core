'use strict';

module.exports = {
  tests: [{
    can: 'get type of string',
    input: 'test',
    output: 'string'
  }, {
    can: 'get type of object',
    input: {foo: 'bar'},
    output: 'object'
  }, {
    can: 'get type of array',
    input: [1, 2, 3],
    output: 'array'
  }, {
    can: 'get type of null',
    input: null,
    output: 'null'
  }, {
    can: 'get type of number',
    input: 34,
    output: 'number'
  }]
};
