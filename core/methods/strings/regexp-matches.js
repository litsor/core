'use strict';

module.exports = {
  id: 'regexpMatches',
  title: 'Regular expression matches',
  description: 'Get captures from regular expression',

  requires: [],

  mockups: {},

  tests: [],

  binary: async (input, pattern) => {
    const regexp = new RegExp(pattern, 'g');
    return input.match(regexp);
  }
};
