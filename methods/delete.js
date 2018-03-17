'use strict';

module.exports = {
  name: 'Delete',
  description: 'Delete object from the database',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      id: {
        name: 'Object id',
        type: 'string'
      },
      model: {
        name: 'Model name',
        type: 'string'
      }
    },
    required: ['id', 'model'],
    additionalProperties: false
  },

  outputSchema: () => {
    return {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          minLength: 1
        }
      }
    };
  },

  requires: ['Database'],

  mockups: {
    Database: {
      get() {
        return {
          findById() {
            return {
              dataValues: {id: '1', name: 'Test'},
              destroy() {}
            };
          }
        };
      }
    }
  },

  tests: [{
    name: 'Delete object',
    input: {id: '1', model: 'Item'},
    output: {id: '1', name: 'Test'},
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
  }],

  execute: async ({id, model}, {Database}) => {
    const db = Database.get(model);
    const item = await db.findById(id);
    if (item === null) {
      throw new Error(`${model} does not exist`);
    }
    const output = {...item.dataValues};
    await item.destroy();
    return output;
  }
};
