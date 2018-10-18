'use strict';

module.exports = {
  title: 'Script',
  description: 'Execute a script',

  leftSchema: {
    title: 'Script input',
    type: 'object'
  },
  rightSchema: {
    title: 'Script name',
    type: 'string'
  },

  requires: ['ScriptsManager'],

  binary: async (input, script, {ScriptsManager}) => {
    return ScriptsManager.get(script).run(input);
  }
};
