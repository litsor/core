'use strict';

module.exports = {
  id: 'scopeIntersection',
  title: 'Scope intersection',
  description: 'Calculate the intersection of two scopes',
  isBinary: true,
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      left: {
        title: 'First scope',
        type: 'string'
      },
      right: {
        title: 'Second scope',
        type: 'string'
      }
    },
    required: ['left', 'right'],
    additionalProperties: false
  },

  outputSchema: () => {
    return {type: 'string'};
  },

  defaults: {},

  requires: [],

  tests: [{
    title: 'Will return all scopes if left and right are identical',
    input: {
      left: 'a b c',
      right: 'a b c'
    },
    output: 'a b c'
  }, {
    title: 'Will not return any scopes if no common scopes found',
    input: {
      left: 'a b c',
      right: 'd e f'
    },
    output: ''
  }, {
    title: 'Will return all right scopes if left has a wildcard',
    input: {
      left: '*',
      right: 'a b c'
    },
    output: 'a b c'
  }, {
    title: 'Will return all left scopes if right has a wildcard',
    input: {
      left: 'a b c',
      right: '*'
    },
    output: 'a b c'
  }, {
    title: 'Does not return any scopes if left scope is empty',
    input: {
      left: '',
      right: 'a b c'
    },
    output: ''
  }, {
    title: 'Does not return any scopes if right scope is empty',
    input: {
      left: 'a b c',
      right: ''
    },
    output: ''
  }, {
    title: 'Returns more specific scope if calculating intersection with more generic scope (given on the right)',
    input: {
      left: 'a:24 a:25',
      right: 'a'
    },
    output: 'a:24 a:25'
  }, {
    title: 'Returns more specific scope if calculating intersection with more generic scope (given on the left)',
    input: {
      left: 'a',
      right: 'a:24 a:25'
    },
    output: 'a:24 a:25'
  }, {
    title: 'Evaluates wildcards in the left scope',
    input: {
      left: 'Post:*',
      right: 'Post:34'
    },
    output: 'Post:34'
  }, {
    title: 'Evaluates wildcards in the right scope',
    input: {
      left: 'Post:34',
      right: 'Post:*'
    },
    output: 'Post:34'
  }, {
    title: 'Will fill-in wildcards in the left scope when appropriate',
    input: {
      left: 'Post:*:read',
      right: 'Post:34'
    },
    output: 'Post:34:read'
  }, {
    title: 'Will fill-in wildcards in the right scope when appropriate',
    input: {
      left: 'Post:34',
      right: 'Post:*:read'
    },
    output: 'Post:34:read'
  }, {
    title: 'Will fill-in wildcards on both sides',
    input: {
      left: 'Post:34:*',
      right: '*:*:read'
    },
    output: 'Post:34:read'
  }, {
    title: 'Will not fill-in wildcards if not all parts match',
    input: {
      left: 'Post:*:write',
      right: '*:*:read'
    },
    output: ''
  }],

  binary: async (left, right) => {
    const leftScope = left.split(' ').filter(item => item);
    const rightScope = right.split(' ').filter(item => item);

    // Fill-in wildcards, see last testcases.
    const addDerivedScopes = (leftScope, rightScope) => {
      return leftScope.reduce((prev, scope) => {
        const newScopes = rightScope.reduce((prev, rightScope) => {
          const parts = rightScope.split(':');
          const newScope = scope.split(':').map((part, index) => {
            return part === '*' && parts[index] ? parts[index] : part;
          }).join(':');
          return newScope === scope ? prev : [...prev, newScope];
        }, []);
        return [...prev, ...newScopes];
      }, leftScope);
    };

    // Check if scope matches at least one of the patterns.
    const match = (scope, patterns) => {
      const parts = scope.split(':');
      return patterns.reduce((prev, pattern) => {
        const patternParts = pattern.split(':');
        return prev || patternParts.map((part, index) => part === '*' || parts[index] === part).reduce((prev, curr) => prev && curr, true);
      }, false);
    };

    const leftMatches = addDerivedScopes(leftScope, rightScope).filter(item => match(item, rightScope));
    const rightMatches = addDerivedScopes(rightScope, leftScope).filter(item => match(item, leftScope));

    return [...leftMatches, ...rightMatches].filter((item, index, array) => array.indexOf(item) === index).sort().join(' ');
  }
};
