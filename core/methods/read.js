'use strict';

const {union, intersection} = require('lodash');
const {NotFound} = require('http-errors');

module.exports = {
  title: 'Read',
  description: 'Retrieve a single object from the database',
  isUnary: true,
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      id: {
        title: 'Object id',
        type: 'string'
      },
      model: {
        title: 'Model name',
        type: 'string'
      },
      selections: {
        title: 'Selected fields',
        type: 'object'
      },
      nullOnError: {
        title: 'Return null when item is not found',
        type: 'boolean'
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
          findOne({where}) {
            return {dataValues: {id: where.id, title: 'Test'}};
          }
        };
      }
    }
  },

  tests: [{
    title: 'Read object',
    input: {id: '1', model: 'Item'},
    output: {id: '1', title: 'Test'},
    outputSchema: {
      type: 'object',
      properties: {
        id: {type: 'string', minLength: 1}
      }
    }
  }],

  unary: async ({id, model, selections, nullOnError}, {Database, Models, ScriptsManager}) => {
    const modelInstance = await Models.get(model);
    const db = Database.get(model);

    // Get attributes that we need to fetch from the database.
    let attributes = union(Object.keys(modelInstance.properties), ['id']);
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
      throw new NotFound(`${model} does not exist`);
    }

    const data = Object.keys(modelInstance.properties).reduce((prev, key) => ({
      ...prev,
      [key]: ['object', 'array'].indexOf(modelInstance.properties[key].type) >= 0 && typeof item.dataValues[key] === 'string' ? JSON.parse(item.dataValues[key]) : item.dataValues[key]
    }), {});
    data.id = id;

    // Expand referenced objects.
    const promises = [];
    Object.keys(data).forEach(field => {
      if (typeof modelInstance.properties[field] === 'object' && modelInstance.properties[field].isReference) {
        promises.push((async () => {
          const refmodel = modelInstance.properties[field].$ref.substring(14);
          try {
            const {storage} = Models.get(refmodel);
            const script = ScriptsManager.get(`Storage${storage}Read`);
            item[field] = await script.run({
              model: refmodel,
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

    return data;
  }
};
