'use strict';

module.exports = {
  tests: [{
    can: 'compare strings',
    left: 'foo',
    right: 'bar',
    output: false
  }, {
    can: 'compare numbers',
    left: 123,
    right: 123,
    output: true
  }, {
    can: 'compare booleans',
    left: true,
    right: true,
    output: true
  }, {
    can: 'compare with null',
    left: true,
    right: null,
    output: false
  }, {
    can: 'detect that false does not null',
    left: false,
    right: null,
    output: false
  }, {
    can: 'detect that numbers in strings cannot equal numbers',
    left: '123',
    right: 123,
    output: false
  }]
}
