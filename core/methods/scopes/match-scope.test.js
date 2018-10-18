'use strict';

module.exports = {
  tests: [{
    can: 'return true if exact scope was provided in userScopes',
    left: 'a',
    right: 'a b c',
    output: true
  }, {
    can: 'return false if scope was not provided',
    left: 'd',
    right: 'a b c',
    output: false
  }, {
    can: 'return true if scope matches a pattern',
    left: 'user:34',
    right: 'user:*',
    output: true
  }, {
    can: 'return true if wildcard is given in userScopes',
    left: 'user:34',
    right: '*',
    output: true
  }, {
    can: 'return false if userScopes is empty',
    left: 'user:34',
    right: '',
    output: false
  }, {
    can: 'return true if scope is empty',
    left: '',
    right: 'a b c',
    output: true
  }, {
    can: 'return false if not all scopes matches',
    left: 'a d',
    right: 'a b c',
    output: false
  }, {
    can: 'return true if all scopes matches',
    left: 'a b',
    right: 'a b c',
    output: true
  }]
};
