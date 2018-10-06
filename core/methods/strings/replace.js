'use strict';

module.exports = {
  name: 'Replace',
  requires: [],
  tests: [],
  binary: (input, replacements, {}) => {
    Object.keys(replacements).forEach(key => {
      input = input.split(key).join(replacements[key]);
    })
    return input;
  }
};
