'use strict';

module.exports = {
  name: 'Keys',
  requires: [],
  tests: [],
  unary: input => {
    if (typeof input !== 'object' || input === null) {
      return [];
    }
    return Object.keys(input);
  }
};
