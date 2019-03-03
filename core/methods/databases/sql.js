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

  requires: ['Database', 'Immutable'],

  binary: async (parameters, query, {Database, Immutable}) => {
    const result = await Database.query(query, parameters.toJS());
    return Immutable.fromJS(JSON.parse(JSON.stringify(result[0])));
  }
};
