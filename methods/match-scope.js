'use strict';

module.exports = {
  name: 'Match scope',
  description: 'Match scope with user scopes',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      scope: {
        name: 'Scope to check access for',
        type: 'string'
      },
      userScopes: {
        name: 'User scopes',
        type: 'string'
      }
    },
    required: ['scope', 'userScopes'],
    additionalProperties: false
  },

  outputSchema: () => {
    return {type: 'boolean'};
  },

  defaults: {},

  requires: [],

  tests: [{
    name: 'Returns true if exact scope was provided in userScopes',
    input: {
      scope: 'a',
      userScopes: 'a b c'
    },
    output: true
  }, {
    name: 'Returns false if scope was not provided',
    input: {
      scope: 'd',
      userScopes: 'a b c'
    },
    output: false
  }, {
    name: 'Returns true if scope matches a pattern',
    input: {
      scope: 'user:34',
      userScopes: 'user:*'
    },
    output: true
  }, {
    name: 'Returns true if wildcard is given in userScopes',
    input: {
      scope: 'user:34',
      userScopes: '*'
    },
    output: true
  }, {
    name: 'Returns false if userScopes is empty',
    input: {
      scope: 'user:34',
      userScopes: ''
    },
    output: false
  }, {
    name: 'Returns true if scope is empty',
    input: {
      scope: '',
      userScopes: 'a b c'
    },
    output: true
  }, {
    name: 'Returns false if not all scopes matches',
    input: {
      scope: 'a d',
      userScopes: 'a b c'
    },
    output: false
  }, {
    name: 'Returns true if all scopes matches',
    input: {
      scope: 'a b',
      userScopes: 'a b c'
    },
    output: true
  }],

  execute: async ({scope, userScopes}) => {
    const patterns = userScopes.split(' ').filter(item => item);
    return scope.split(' ').filter(item => item).reduce((prev, scope) => {
      const parts = scope.split(':');
      return prev && patterns.reduce((prev, pattern) => {
        const patternParts = pattern.split(':');
        return prev || patternParts.map((part, index) => part === '*' || parts[index] === part).reduce((prev, curr) => prev && curr, true);
      }, false);
    }, true);
  }
};
