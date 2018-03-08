'use strict';

const {union, intersection} = require('lodash');

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
      },
      selections: {
        name: 'Selected fields',
        type: 'object'
      },
      nullOnError: {
        name: 'Return null when item is not found',
        type: 'boolean'
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

  execute: async ({id, table, selections, nullOnError}, {Database, Models, ScriptsManager}) => {
    const model = await Models.get(table);
    const db = Database.get(table);

    // Get attributes that we need to fetch from the database.
    let attributes = union(Object.keys(model.properties), ['id']);
    if (selections) {
      // If a selections object was provided, select only fields that appear in both the
      // model and the selections, but do always include "id".
      const selectedFields = union(Object.keys(selections || {}), ['id']);
      attributes = intersection(attributes, selectedFields);
    }

    const item = await db.findOne({attributes, where: {id}});
    if (item === null) {
      if (nullOnError) {
        return null;
      }
      throw new Error(`${table} does not exist`);
    }

    // Expand referenced objects.
    const promises = [];
    Object.keys(item.dataValues).forEach(field => {
      if (typeof model.properties[field] === 'object' && model.properties[field].isReference) {
        promises.push((async () => {
          const refTable = model.properties[field].$ref.substring(14);
          try {
            const script = ScriptsManager.get('Get');
            item[field] = await script.run({
              table: refTable,
              id: item[field]
            });
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
