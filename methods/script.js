'use strict';

module.exports = {
  name: 'Script',
  description: 'Execute a script',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      script: {
        name: 'Script name',
        type: 'string'
      },
      input: {
        name: 'Script input',
        type: 'object'
      }
    },
    required: ['script'],
    additionalProperties: {
      name: 'Variable'
    }
  },

  outputSchema: () => {
    return {};
  },

  defaults: {
    input: '/'
  },

  requires: ['ScriptsManager'],

  mockups: {
    ScriptsManager: {
      get: () => {
        return {
          run() {
            return 'test';
          }
        };
      }
    }
  },

  tests: [{
    name: 'Run script',
    input: {
      script: 'Test',
      input: {}
    },
    output: 'test'
  }],

  execute: async ({script, input, ...variables}, {ScriptsManager}) => {
    return ScriptsManager.get(script).run({...input, ...variables});
  }
};
