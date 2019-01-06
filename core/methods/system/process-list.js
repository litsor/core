'use strict';

module.exports = {
  name: 'Processlist',
  requires: ['ScriptsManager'],
  inputSchema: {
    type: 'string'
  },
  unary: (name, {ScriptsManager}) => {
    return ScriptsManager.get(name).getProcessList();
  }
};
