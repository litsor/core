'use strict';

module.exports = {
  name: 'Normalize scope',
  description: 'Normalize an OAuth scope string',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      scope: {
        name: 'Scope string',
        type: 'string'
      },
      patterns: {
        name: 'Patterns',
        type: 'array',
        items: {
          name: 'Pattern',
          type: 'string'
        }
      }
    },
    required: ['scope'],
    additionalProperties: false
  },

  outputSchema: inputSchema => {
    const property = (inputSchema.properties || {}).scope || {};
    const schema = {type: 'string'};
    if (property.maxLength) {
      schema.maxLength = property.maxLength;
    }
    return schema;
  },

  defaults: {
    scope: '/scope',
    _output: '/scope'
  },

  requires: [],

  tests: [{
    name: 'Will sort scopes',
    input: {
      scope: 'a b d c'
    },
    output: 'a b c d'
  }, {
    name: 'Will filter duplicates',
    input: {
      scope: 'a b c c'
    },
    output: 'a b c'
  }, {
    name: 'Will filter specific scopes covered by more generic scope',
    input: {
      scope: 'a b b:34'
    },
    output: 'a b'
  }, {
    name: 'Will not combine different specific scopes',
    input: {
      scope: 'b:3 b:4'
    },
    output: 'b:3 b:4'
  }, {
    name: 'Will remove other scopes if "*" was provided',
    input: {
      scope: 'a b *'
    },
    output: '*'
  }, {
    name: 'Will not output any scopes when no input scopes are given',
    input: {
      scope: ''
    },
    output: ''
  }, {
    name: 'Will filter scopes not matched by given patterns',
    input: {
      scope: 'a b b:3 c:4',
      patterns: ['b', 'c:*']
    },
    output: 'b c:4'
  }],

  execute: async ({scope, patterns}) => {
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
