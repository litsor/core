'use strict';

module.exports = {
  mockups: {
    Database: {
      get() {
        return {
          findById() {
            return {
              dataValues: {id: '1', title: 'Test'},
              destroy() {}
            };
          }
        };
      }
    }
  },

  tests: [{
    title: 'Delete object',
    input: {id: '1', model: 'Item'},
    output: {id: '1', title: 'Test'},
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string'
        }
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        id: {type: 'string', minLength: 1}
      }
    }
  }]
};
