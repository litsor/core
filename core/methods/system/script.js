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

  requires: ['ScriptsManager', 'Immutable'],

  binary: async (input, script, {ScriptsManager, Immutable}) => {
    return Immutable.fromJS(await ScriptsManager.get(script).run(input));
  }
};
