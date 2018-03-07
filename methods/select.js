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

  requires: ['Database', 'Models', 'ScriptsManager'],

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

  execute: async ({filters, table, offset, limit, selections}, {Database, Models, ScriptsManager}) => {
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

    // Build a list of referenced objects.
    const model = await Models.get(table);
    const references = {};
    output.items.forEach((item, index) => {
      Object.keys(item.dataValues).forEach(field => {
        if (typeof model.properties[field] === 'object' && model.properties[field].isReference) {
          const refTable = model.properties[field].$ref.substring(14);
          const id = item[field];
          if (typeof references[`${refTable}:${id}`] === 'undefined') {
            references[`${refTable}:${id}`] = [];
          }
          references[`${refTable}:${id}`].push({index, field});
        }
      });
    });

    // Fetch referenced objects.
    const script = ScriptsManager.get('Get');
    const promises = Object.keys(references).map(key => (async () => {
      const [table, id] = key.split(':');
      let result = null;
      try {
        result = (await script.run({table, id})).data;
      } catch (err) {
        console.log('Unable to fetch reference: ' + err.message);
      }
      references[key].forEach(({index, field}) => {
        output.items[index][field] = result;
      });
    })());
    await Promise.all(promises);

    return output;
  }
};
