'use strict';

const HttpError = require('http-errors');

class GraphqlApi {
  constructor(app, storage) {
    this.app = app;
    this.storage = storage;

    app.process('GET /graphql', (request, context) => {
      const query = request.getQuery('q', 'string', '{}');
      return this.storage.query(query, context).then(response => {
        return {data: response};
      }).catch(err => {
        if (err.message === 'Query error: Permission denied') {
          throw new HttpError(403);
        }
        throw err;
      });
    });
    app.process('POST /graphql', (request, context) => {
      const query = request.body.query;
      let args = request.body.variables;
      if (typeof query !== 'string') {
        throw new HttpError(400, 'Query missing or invalid');
      }
      if (typeof args !== 'object') {
        args = {};
      }
      return this.storage.query(query, context, args).then(response => {
        return {data: response};
      });
    });
  }
}

module.exports = GraphqlApi;
