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

  requires: ['Database', 'Models', 'ScriptsManager'],

  tests: [],

  execute: async ({id, table}, {Database, Models, ScriptsManager}) => {
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
          try {
            const script = ScriptsManager.get('Get');
            const result = await script.run({
              table: refTable,
              id: item[field]
            });
            item[field] = result.data;
          } catch (err) {
            console.log('Unable to fetch reference: ' + err.message);
            item[field] = null;
          }
        })());
      }
    });
    await Promise.all(promises);

    return item.dataValues;
  }
};
