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
      table: {
        name: 'Tablename',
        type: 'string'
      }
    },
    required: ['id', 'table'],
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
    input: {id: '1', table: 'Item'},
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

  execute: async ({id, table}, {Database}) => {
    const db = Database.get(table);
    const item = await db.findById(id);
    if (item === null) {
      throw new Error(`${table} does not exist`);
    }
    const output = {...item.dataValues};
    await item.destroy();
    return output;
  }
};
