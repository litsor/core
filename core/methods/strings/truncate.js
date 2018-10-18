'use strict';

module.exports = {
  title: 'Truncate',
  description: 'Truncate string to length',

  inputSchema: {},

  binary: (string, length) => string.substring(0, length)
};
