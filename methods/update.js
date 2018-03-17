'use strict';

const {Op} = require('sequelize');

module.exports = {
  name: 'Update',
  description: 'Update object in the database',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      id: {
        name: 'Object id',
        type: 'string'
      },
      data: {
        name: 'Data',
        type: 'object'
      },
      model: {
        name: 'Model name',
        type: 'string'
      }
    },
    required: ['id', 'data', 'model'],
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

  mockups: {
    Database: {
      get() {
        return {
          findById() {
            return {};
          },
          update() {}
        };
      }
    }
  },

  tests: [{
    name: 'Update object',
    input: {data: {name: 'Test'}, id: '1', model: 'Item'},
    output: {id: '1', name: 'Test'},
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            name: {type: 'string'}
          }
        },
        id: {type: 'string'},
        model: {type: 'string'}
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        id: {type: 'string', minLength: 1},
        name: {type: 'string'}
      }
    }
  }],

  execute: async ({id, data, model}, {Database}) => {
    const db = Database.get(model);
    const item = await db.findById(id);
    if (item === null) {
      throw new Error(`${model} does not exist`);
    }
    await db.update(data, {
      where: {
        id: {
          [Op.eq]: id
        }
      }
    });
    return {...data, id};
  }
};
