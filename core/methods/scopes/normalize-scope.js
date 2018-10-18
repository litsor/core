'use strict';

module.exports = {
  title: 'Normalize scope',
  description: 'Normalize an OAuth scope string',

  inputSchema: {
    title: 'Scope string',
    type: 'string'
  },

  unary: async scope => {
    // @todo: create a binary variant with patterns
    const patterns = null;

    const scopes = scope.split(' ').filter((item, index, all) => {
      // Filter duplicate scopes.
      return all.indexOf(item) === index;
    }).filter(item => {
      // If patterns are provided, filter scopes that do not match a pattern.
      if (patterns && patterns.length > 0) {
        const parts = item.split(':');
        return patterns.reduce((prev, pattern) => {
          const patternParts = pattern.split(':');
          return prev || patternParts.map((part, index) => part === '*' || parts[index] === part).reduce((prev, curr) => prev && curr, true);
        }, false);
      }
      return true;
    }).filter(item => {
      // Filter empty scopes.
      return item;
    }).filter((item, _, all) => {
      // Filter scopes that are covered by more generic scopes.
      return !item.split(':').reduce((prev, curr) => {
        return {
          parts: [...prev.parts, curr],
          found: prev.found || all.indexOf(prev.parts.join(':')) >= 0
        };
      }, {parts: [], found: false}).found;
    }).sort();

    // Remove specific scopes if full scope is given.
    if (scopes.indexOf('*') >= 0) {
      return '*';
    }

    return scopes.join(' ');
  }
};
