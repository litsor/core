'use strict';

module.exports = {
  mockups: {
    Statistics: {
      export: () => {
        return '...Prometheus export...';
      }
    }
  },

  tests: [{
    can: 'get internal statistics',
    input: 'all',
    output: '...Prometheus export...'
  }],
};
