'use strict';

class GraphQLEndpoint {
  constructor(app, storage, options) {
    this.app = app;
    this.storage = storage;

    const self = this;
    app.process('GET /graphql', function() {
      const query = this.getQuery('q', 'string', '{}');
      return self.storage.query(query);
    });
    app.process('POST /graphql', function() {
      const query = this.body.query;
      let args = this.body.arguments;
      if (typeof query !== 'string') {
        throw new Error('Query missing or invalid.');
      }
      if (!(args instanceof Array)) {
        args = [];
      }
      return self.storage.query(query, args);
    });
  }
}

module.exports = GraphQLEndpoint;
