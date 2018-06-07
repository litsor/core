'use strict';

module.exports = {
  title: 'Has script',
  description: 'Check if a script exists',
  isBinary: true,
  cache: 0,

  inputSchema: {
    title: 'Script name',
    type: 'string'
  },

  requires: ['ScriptsManager'],

  mockups: {
    ScriptsManager: {
      has: name => name === 'DoesExist'
    }
  },

  tests: [{
    title: 'Detects existing scripts',
    input: 'DoesExist',
    output: true
  }, {
    title: 'Detects unexisting scripts',
    input: 'DoesNotExist',
    output: false
  }],

  unary: async (name, {ScriptsManager}) => {
    return ScriptsManager.has(name);
  }
};
