'use strict';

const Validator = require('is-my-json-valid');

const queryValidator = Validator({
  type: 'object',
  required: ['query'],
  properties: {
    query: {
      type: 'string'
    },
    arguments: {
      type: 'array'
    }
  },
  additionalProperties: false
});

class GraphQLEndpoint {
  constructor(app, storage, options) {
    this.app = app;
    this.storage = storage;

    app.process('GET /graphql', (request, context) => {
      const query = request.getQuery('q', 'string', '{}');
      return this.storage.query(query, context).catch(error => {
        if (error.message === 'Query error: Permission denied') {
          request.status = 403;
          return {errors:[{message:'Permission denied'}]};
        }
        throw error;
      });
    });
    app.process('POST /graphql', (request, context) => {
      const query = request.body.query;
      let args = request.body.arguments;
      if (typeof query !== 'string') {
        throw new Error('Query missing or invalid.');
      }
      if (!(args instanceof Array)) {
        args = [];
      }
      return this.storage.query(query, context, args).catch(error => {
        if (error.message === 'Query error: Permission denied') {
          request.status = 403;
          return {errors:[{message:'Permission denied'}]};
        }
        throw error;
      });
    });
  }
}

module.exports = GraphQLEndpoint;
