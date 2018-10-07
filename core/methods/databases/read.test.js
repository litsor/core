'use strict';

module.exports = {
  mockups: {
    Models: {
      get() {
        return {
          properties: {
            title: {type: 'string'}
          }
        };
      }
    },
    Database: {
      get() {
        return {
          findOne({where}) {
            return {dataValues: {id: where.id, title: 'Test'}};
          }
        };
      }
    }
  },

  tests: [{
    can: 'read object',
    input: {id: '1', model: 'Item'},
    output: {id: '1', title: 'Test'},
    outputSchema: {
      type: 'object',
      properties: {
        id: {type: 'string', minLength: 1}
      }
    }
  }]
};
