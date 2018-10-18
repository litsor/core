'use strict';

module.exports = {
  mockups: {
    ScriptsManager: {
      has: name => name === 'DoesExist'
    }
  },

  tests: [{
    can: 'detect existing scripts',
    input: 'DoesExist',
    output: true
  }, {
    can: 'detect unexisting scripts',
    input: 'DoesNotExist',
    output: false
  }]
};
