'use strict';

module.exports = {
  title: 'create',
  description: 'Create new object in the database',
  isUnary: true,
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      data: {
        title: 'Data',
        type: 'object'
      },
      model: {
        title: 'Model name',
        type: 'string'
      }
    },
    required: ['data', 'model'],
    additionalProperties: false
  },

  outputSchema: inputSchema => {
    const data = inputSchema.properties.data || {};
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
          create(data) {
            return {...data, id: '1'};
          }
        };
      }
    }
  },

  tests: [{
    title: 'Create object',
    input: {data: {title: 'Test'}, model: 'Item'},
    output: {id: '1', title: 'Test'},
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            title: {type: 'string'}
          }
        }
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        id: {type: 'string', minLength: 1},
        title: {type: 'string'}
      }
    }
  }],

  unary: async ({data, model}, {Database}) => {
    const inputData = Object.keys(data).reduce((prev, curr) => ({
      ...prev,
      [curr]: typeof data[curr] === 'object' && data[curr] !== null ? JSON.stringify(data[curr]) : data[curr]
    }), {});
    const db = Database.get(model);
    const item = await db.create(inputData);
    return {...data, id: item.id};
  }
};
