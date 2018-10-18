'use strict';

module.exports = {
  tests: [{
    can: 'sort scopes',
    input: 'a b d c',
    output: 'a b c d'
  }, {
    can: 'filter duplicates',
    input: 'a b c c',
    output: 'a b c'
  }, {
    can: 'filter specific scopes covered by more generic scope',
    input: 'a b b:34',
    output: 'a b'
  }, {
    can: 'not combine different specific scopes',
    input: 'b:3 b:4',
    output: 'b:3 b:4'
  }, {
    can: 'remove other scopes if "*" was provided',
    input: 'a b *',
    output: '*'
  }, {
    can: 'not output any scopes when no input scopes are given',
    input: '',
    output: ''
  }]
};
