'use strict';

module.exports = {
  title: 'Scope intersection',
  description: 'Calculate the intersection of two scopes',

  leftSchema: {
    title: 'First scope',
    type: 'string'
  },
  rightSchema: {
    title: 'Second scope',
    type: 'string'
  },

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
