'use strict';

module.exports = {
  title: 'create',
  description: 'Create new object in the database',

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

  requires: ['Database'],

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
