'use strict';

module.exports = {
  title: 'split',
  description: 'Split string on separator',

  leftSchema: {
    title: 'Input string',
    type: 'string'
  },
  rightSchema: {
    title: 'Separator',
    type: 'string'
  },

  binary: (input, separator) => {
    return input.split(separator);
  }
};
