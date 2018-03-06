'use strict';

const {Op, fn, col} = require('sequelize');

module.exports = {
  name: 'Select',
  description: 'Select objects from the database',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      table: {
        name: 'Tablename',
        type: 'string'
      },
      filters: {
        name: 'Selection criteria',
        type: 'object'
      },
      offset: {
        name: 'Offset',
        type: 'integer',
        minimum: 0
      },
      limit: {
        name: 'Limit',
        type: 'integer',
        minimum: 1
      },
      selections: {
        name: 'Selected fields',
        type: 'array',
        items: {
          name: 'Fieldname',
          type: 'string'
        }
      }
    },
    required: ['table'],
    additionalProperties: false
  },

  outputSchema: () => {
    return {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            minLength: 1
          }
        }
      }
    };
  },

  requires: ['Database', 'Models'],

  mockups: {
    Database: {
      get() {
        return {
          findAll() {
            return [{id: '1', name: 'Test A'}];
          }
        };
      }
    }
  },

  tests: [{
    name: 'Can select all results',
    input: {
      table: 'Post',
      selections: ['count', 'items']
    },
    output: {count: 1, items: [{id: '1', name: 'Test A'}]}
  }],

  execute: async ({filters, table, offset, limit, selections}, {Database, Models}) => {
    const where = Object.keys(filters || {}).reduce((prev, name) => {
      const match = name.match(/^(.+)_(ne|gt|gte|lt|lte|like|notLike|in|notIn)$/);
      let field = name;
      let operator = 'eq';
      if (match) {
        field = match[1];
        operator = match[2];
      }
      return {
        ...prev,
        [field]: {
          [Op[operator]]: filters[name]
        }
      };
    }, {});

    const db = Database.get(table);
    const output = {};

    output.items = await db.findAll({
      where,
      limit: limit || 10,
      offset: offset || 0
    });

    if ((selections || []).indexOf('count') >= 0) {
      output.count = (await db.findAll({
        attributes: [[fn('COUNT', col('id')), 'count']],
        where
      }))[0].dataValues.count;
    }

    // Expand referenced objects.
    // @todo: It is not uncommon that multiple rows refer to the same object. We only need to load it once.
    // @todo: Fetch referenced objects via joins.
    const promises = [];
    const model = await Models.get(table);
    output.items.forEach((item, index) => {
      Object.keys(item.dataValues).forEach(field => {
        if (typeof model.properties[field] === 'object' && model.properties[field].isReference) {
          promises.push((async () => {
            const refTable = model.properties[field].$ref.substring(14);
            const db = Database.get(refTable);
            output.items[index][field] = await db.findById(item[field]);
          })());
        }
      });
    });
    await Promise.all(promises);

    return output;
  }
};
