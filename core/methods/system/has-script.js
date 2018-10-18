'use strict';

module.exports = {
  title: 'Has script',
  description: 'Check if a script exists',

  inputSchema: {
    title: 'Script name',
    type: 'string'
  },

  requires: ['ScriptsManager'],

  unary: async (name, {ScriptsManager}) => {
    return ScriptsManager.has(name);
  }
};
