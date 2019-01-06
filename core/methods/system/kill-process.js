'use strict';

module.exports = {
  name: 'Kill process',
  requires: ['ScriptsManager'],
  inputSchema: {
    type: 'object',
    properties: {
      scriptId: {
        title: 'Script id',
        type: 'string'
      },
      processId: {
        title: 'Process id',
        type: 'string'
      }
    },
    required: ['scriptId', 'processId']
  },
  unary: ({scriptId, processId}, {ScriptsManager}) => {
    ScriptsManager.get(scriptId).kill(processId);
    return null;
  }
};
