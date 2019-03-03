'use strict';

module.exports = {
  mockups: {
    Database: {
      get() {
        return {
          findByPk() {
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
    can: 'delete object',
    input: {id: '1', model: 'Item'},
    output: {id: '1'},
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string'
        }
      }
    }
  }]
};
