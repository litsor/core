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
      table: {
        name: 'Tablename',
        type: 'string'
      }
    },
    required: ['id', 'data', 'table'],
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
    input: {data: {name: 'Test'}, id: '1', table: 'Item'},
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
        table: {type: 'string'}
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

  execute: async ({id, data, table}, {Database}) => {
    const db = Database.get(table);
    const item = await db.findById(id);
    if (item === null) {
      throw new Error(`${table} does not exist`);
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
