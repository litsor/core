'use strict';

module.exports = {
  name: 'Processlist',
  requires: ['ScriptsManager', 'Immutable'],
  inputSchema: {
    type: 'string'
  },
  unary: (name, {ScriptsManager, Immutable}) => {
    return Immutable.fromJS(ScriptsManager.get(name).getProcessList());
  }
};
