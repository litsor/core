'use strict';

module.exports = {
  tests: [{
    can: 'return all scopes if left and right are identical',
    left: 'a b c',
    right: 'a b c',
    output: 'a b c'
  }, {
    can: 'not return any scopes if no common scopes found',
    left: 'a b c',
    right: 'd e f',
    output: ''
  }, {
    can: 'return all right scopes if left has a wildcard',
    left: '*',
    right: 'a b c',
    output: 'a b c'
  }, {
    can: 'return all left scopes if right has a wildcard',
    left: 'a b c',
    right: '*',
    output: 'a b c'
  }, {
    can: 'not return any scopes if left scope is empty',
    left: '',
    right: 'a b c',
    output: ''
  }, {
    can: 'not return any scopes if right scope is empty',
    left: 'a b c',
    right: '',
    output: ''
  }, {
    can: 'return more specific scope if calculating intersection with more generic scope (given on the right)',
    left: 'a:24 a:25',
    right: 'a',
    output: 'a:24 a:25'
  }, {
    can: 'return more specific scope if calculating intersection with more generic scope (given on the left)',
    left: 'a',
    right: 'a:24 a:25',
    output: 'a:24 a:25'
  }, {
    can: 'evaluate wildcards in the left scope',
    left: 'Post:*',
    right: 'Post:34',
    output: 'Post:34'
  }, {
    can: 'evaluate wildcards in the right scope',
    left: 'Post:34',
    right: 'Post:*',
    output: 'Post:34'
  }, {
    can: 'fill in wildcards in the left scope when appropriate',
    left: 'Post:*:read',
    right: 'Post:34',
    output: 'Post:34:read'
  }, {
    can: 'fill in wildcards in the right scope when appropriate',
    left: 'Post:34',
    right: 'Post:*:read',
    output: 'Post:34:read'
  }, {
    can: 'fill in wildcards on both sides',
    left: 'Post:34:*',
    right: '*:*:read',
    output: 'Post:34:read'
  }, {
    can: 'not fill in wildcards if not all parts match',
    left: 'Post:*:write',
    right: '*:*:read',
    output: ''
  }]
};
