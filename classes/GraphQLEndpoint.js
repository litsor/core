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

    const self = this;
    app.process('GET /graphql', function(context) {
      const query = this.getQuery('q', 'string', '{}');
      return self.storage.query(query, context).catch(error => {
        if (error.message === 'Query error: Permission denied') {
          this.status = 403;
          return {errors:[{message:'Permission denied'}]};
        }
        throw error;
      });
    });
    app.process('POST /graphql', function(context) {
      const query = this.body.query;
      let args = this.body.arguments;
      if (typeof query !== 'string') {
        throw new Error('Query missing or invalid.');
      }
      if (!(args instanceof Array)) {
        args = [];
      }
      return self.storage.query(query, context, args).catch(error => {
        if (error.message === 'Query error: Permission denied') {
          this.status = 403;
          return {errors:[{message:'Permission denied'}]};
        }
        throw error;
      });
    });
  }
}

module.exports = GraphQLEndpoint;
