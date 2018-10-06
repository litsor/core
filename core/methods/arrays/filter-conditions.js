'use strict';

module.exports = {
  name: 'Filter collection',
  description: 'Filter collection on object with key => value mappings',

  leftSchema: {
    type: 'array',
    items: {
      title: 'Item',
      type: 'object'
    }
  },

  rightSchema: {
    title: 'Filters',
    type: 'object'
  },

  binary: (input, filters) => input.filter(item => Object.keys(filters).reduce((keep, field) => keep && item[field] === filters[field], true))
};
