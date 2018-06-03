'use strict';

const {get, union, intersection} = require('lodash');
const {Op, fn, col} = require('sequelize');

module.exports = {
  title: 'Select',
  description: 'Select objects from the database',
  isUnary: true,
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      model: {
        title: 'modelname',
        type: 'string'
      },
      filters: {
        title: 'Selection criteria',
        type: 'object'
      },
      offset: {
        title: 'Offset',
        type: 'integer',
        minimum: 0
      },
      limit: {
        title: 'Limit',
        type: 'integer',
        minimum: 1
      },
      selections: {
        title: 'Selected fields',
        type: 'object'
      }
    },
    required: ['model'],
    additionalProperties: false
  },

  outputSchema: () => {
    return {
      type: 'object',
      properties: {
        count: {
          type: 'integer',
          minimum: 0
        },
        items: {
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
        }
      }
    };
  },

  requires: ['Database', 'Models', 'ScriptsManager'],

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
          findAll({attributes}) {
            if (Array.isArray(attributes[0])) {
              return [{dataValues: {count: 1}}];
            }
            return [{dataValues: {id: '1', title: 'Test A'}}];
          }
        };
      }
    },
    ScriptsManager: {
      get() {
        return {};
      }
    }
  },

  tests: [{
    title: 'Can select all results',
    input: {
      model: 'Post',
      selections: {count: {}, items: {}}
    },
    output: {count: 1, items: [{id: '1', title: 'Test A'}]}
  }],

  unary: async ({filters, model, offset, limit, selections}, {Database, Models, ScriptsManager}) => {
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

    const modelInstance = await Models.get(model);
    const db = Database.get(model);
    const output = {};

    // Get attributes that we need to fetch from the database.
    let attributes = union(Object.keys(modelInstance.properties), ['id']);
    if (selections) {
      // If a selections object was provided, select only fields that appear in both the
      // model and the selections, but do always include "id".
      const selectedFields = union(Object.keys(get(selections, 'items', {}) || {}), ['id']);
      attributes = intersection(attributes, selectedFields);
    }

    output.items = (await db.findAll({
      attributes,
      where,
      limit: limit || 10,
      offset: offset || 0
    })).map(item => item.dataValues);

    if (Object.keys(selections || {}).indexOf('count') >= 0) {
      output.count = (await db.findAll({
        attributes: [[fn('COUNT', col('id')), 'count']],
        where
      }))[0].dataValues.count;
    }

    // Build a list of referenced objects.
    const references = {};
    output.items.forEach((item, index) => {
      attributes.forEach(field => {
        if (item[field] && typeof modelInstance.properties[field] === 'object' && modelInstance.properties[field].isReference) {
          const refmodel = modelInstance.properties[field].$ref.substring(14);
          const id = item[field];
          if (typeof references[`${refmodel}:${id}`] === 'undefined') {
            references[`${refmodel}:${id}`] = [];
          }
          references[`${refmodel}:${id}`].push({index, field});
        }
      });
    });

    // Fetch referenced objects.
    const script = ScriptsManager.get('Read');
    const promises = Object.keys(references).map(key => (async () => {
      const [model, id] = key.split(':');
      let result = null;
      try {
        result = await script.run({model, id});
      } catch (err) {
        console.log(err);
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
