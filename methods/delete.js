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

  tests: [],

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
