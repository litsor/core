'use strict';

module.exports = {
  title: 'Script',
  description: 'Execute a script',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      script: {
        title: 'Script name',
        type: 'string'
      },
      input: {
        title: 'Script input',
        type: 'object'
      }
    },
    required: ['script'],
    additionalProperties: {
      title: 'Variable'
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
    title: 'Run script',
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
