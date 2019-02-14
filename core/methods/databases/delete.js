'use strict';

module.exports = {
  title: 'Delete',
  description: 'Delete object from the database',

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
      }
    },
    required: ['id', 'model'],
    additionalProperties: false
  },

  requires: ['Database'],

  unary: async ({id, model}, {Database}) => {
    const db = Database.get(model);
    const item = await db.findByPk(id);
    if (item === null) {
      throw new Error(`${model} does not exist`);
    }
    const output = {...item.dataValues};
    await item.destroy();
    return output;
  }
};
