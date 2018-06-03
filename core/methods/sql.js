'use strict';

module.exports = {
  title: 'SQL query',
  description: 'Execute SQL query',
  isBinary: true,
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      query: {
        title: 'SQL query',
        type: 'string'
      },
      parameters: {
        title: 'Query parameters',
        type: 'object'
      }
    },
    required: ['query'],
    additionalProperties: false
  },

  defaults: {
    parameters: {}
  },

  outputSchema: () => {
    return {
      type: 'array',
      items: {
        type: 'object'
      }
    };
  },

  requires: ['Database'],

  mockups: {
    Database: {
      async query() {
        return [[], []];
      }
    }
  },

  tests: [{
    title: 'Execute query',
    input: {query: 'SELECT * FROM tablename'},
    output: [],
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string'
        }
      }
    },
    outputSchema: {
      type: 'array',
      items: {
        type: 'object'
      }
    }
  }],

  binary: async (parameters, query, {Database}) => {
    const result = await Database.query(query, parameters);
    return JSON.parse(JSON.stringify(result[0]));
  }
};
