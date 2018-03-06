'use strict';

module.exports = {
  name: 'Get',
  description: 'Retrieve a single object from the database',
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

  requires: ['Database', 'Models'],

  tests: [],

  execute: async ({id, table}, {Database, Models}) => {
    const db = Database.get(table);
    const item = await db.findById(id);
    if (item === null) {
      throw new Error(`${table} does not exist`);
    }

    // Expand referenced objects.
    const promises = [];
    const model = await Models.get(table);
    Object.keys(item.dataValues).forEach(field => {
      if (typeof model.properties[field] === 'object' && model.properties[field].isReference) {
        promises.push((async () => {
          const refTable = model.properties[field].$ref.substring(14);
          const db = Database.get(refTable);
          item[field] = await db.findById(item[field]);
        })());
      }
    });
    await Promise.all(promises);

    return item.dataValues;
  }
};
