'use strict';

class GraphqlEndpoint {
  constructor(app, storage) {
    this.app = app;
    this.storage = storage;

    app.process('GET /graphql', (request, context) => {
      const query = request.getQuery('q', 'string', '{}');
      return this.storage.query(query, context).catch(err => {
        if (err.message === 'Query error: Permission denied') {
          request.status = 403;
          return {errors: [{message: 'Permission denied'}]};
        }
        throw err;
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
      return this.storage.query(query, context, args).catch(err => {
        if (err.message === 'Query error: Permission denied') {
          request.status = 403;
          return {errors: [{message: 'Permission denied'}]};
        }
        throw err;
      });
    });
  }
}

module.exports = GraphqlEndpoint;
