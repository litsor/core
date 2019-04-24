'use strict';

module.exports = {
  title: 'Join',
  description: 'Join string with separator',
  leftSchema: {
    type: 'array',
    items: {
      title: 'Item',
      type: 'string'
    }
  },
  rightSchema: {
    type: 'string'
  },
  binary: (input, separator) => {
    return input.toJS().join(separator);
  }
};
