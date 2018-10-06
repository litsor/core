'use strict';

module.exports = {
  title: 'Regular expression',
  description: 'Check if input string matches regular expresion',

  requires: [],

  mockups: {},

  tests: [],

  binary: async (input, pattern) => {
    const regexp = new RegExp(pattern);
    return input.match(regexp);
  }
};
