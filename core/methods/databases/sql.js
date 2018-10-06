'use strict';

module.exports = {
  title: 'SQL query',
  description: 'Execute SQL query',

  leftSchema: {
    type: 'object'
  },

  rightSchema: {
    title: 'SQL query',
    type: 'string'
  },

  defaults: {
    parameters: {}
  },

  requires: ['Database'],

  binary: async (parameters, query, {Database}) => {
    const result = await Database.query(query, parameters);
    return JSON.parse(JSON.stringify(result[0]));
  }
};
