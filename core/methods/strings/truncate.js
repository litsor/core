'use strict';

module.exports = {
  title: 'Truncate',
  description: 'Truncate string to length',

  leftSchema: {type: 'string'},
  rightSchema: {type: 'integer', minimum: 1},

  binary: (string, length) => string.substring(0, length)
};
