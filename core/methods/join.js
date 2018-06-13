'use strict';

module.exports = {
  title: 'Join',
  description: 'Join string with separator',
  cache: Infinity,
  requires: [],
  tests: [],
  binary: (input, separator) => {
    return input.join(separator);
  }
};
