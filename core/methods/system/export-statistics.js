'use strict';

module.exports = {
  title: 'Export statistics',
  description: 'Get internal statistics',

  inputSchema: {
    type: 'string'
  },

  requires: ['Statistics'],

  unary: (statistic, {Statistics}) => {
    if (statistic === 'all') {
      try {

        return Statistics.export();
      } catch (err) { console.error(err.stack); }
    }
  }
};
