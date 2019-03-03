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

  requires: ['Database', 'Immutable'],

  unary: async (left, {Database, Immutable}) => {
    const {data, model} = left.toJS();
    const inputData = Object.keys(data).reduce((prev, curr) => ({
      ...prev,
      [curr]: typeof data[curr] === 'object' && data[curr] !== null ? JSON.stringify(data[curr]) : data[curr]
    }), {});
    const db = Database.get(model);
    const item = await db.create(inputData);
    return Immutable.fromJS({...data, id: item.id});
  }
};
