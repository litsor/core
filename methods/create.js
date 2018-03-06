'use strict';

module.exports = {
  name: 'create',
  description: 'Create new object in the database',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      data: {
        name: 'Data',
        type: 'object'
      },
      table: {
        name: 'Tablename',
        type: 'string'
      }
    },
    required: ['data', 'table'],
    additionalProperties: false
  },

  outputSchema: inputSchema => {
    const data = inputSchema.properties.data;
    return {
      ...data,
      properties: {
        ...(data.properties || {}),
        id: {
          type: 'string',
          minLength: 1
        }
      }
    };
  },

  requires: ['Database'],

  tests: [],

  execute: async ({data, table}, {Database}) => {
    const db = Database.get(table);
    const item = await db.create(data);
    return {...data, id: item.id};
  }
};
