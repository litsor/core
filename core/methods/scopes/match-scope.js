'use strict';

module.exports = {
  title: 'Match scope',
  description: 'Match scope with user scopes',

  leftSchema: {
    title: 'Scope to check access for',
    type: 'string'
  },

  rightSchema: {
    title: 'User scopes',
    type: 'string'
  },

  binary: async (scope, userScopes) => {
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
