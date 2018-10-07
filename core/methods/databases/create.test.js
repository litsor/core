'use strict';

module.exports = {
  mockups: {
    Database: {
      get() {
        return {
          create(data) {
            return {...data, id: '1'};
          }
        };
      }
    }
  },

  tests: [{
    can: 'create object',
    input: {data: {title: 'Test'}, model: 'Item'},
    output: {id: '1', title: 'Test'},
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            title: {type: 'string'}
          }
        }
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        id: {type: 'string', minLength: 1},
        title: {type: 'string'}
      }
    }
  }]
};
