'use strict';

module.exports = {
  mockups: {
    Database: {
      async query() {
        return [[], []];
      }
    }
  },

  tests: [{
    can: 'execute query',
    left: {},
    right: 'SELECT * FROM tablename',
    output: []
  }]
};
