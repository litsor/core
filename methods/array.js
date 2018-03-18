'use strict';

const {get} = require('jsonpointer');

module.exports = {
  name: 'Array',
  description: 'Create a new array',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      items: {
        name: 'Input items',
        type: 'array',
        items: {
          name: 'Item'
        }
      },
      input: {
        name: 'Input for referenced items',
        type: 'object'
      }
    },
    required: ['items']
  },

  defaults: {
    input: '/'
  },

  outputSchema: () => {
    return {type: 'array'};
  },

  requires: [],

  tests: [{
    name: 'Create new array',
    input: {
      items: [1, 2, 3]
    },
    inputSchema: {
      type: 'object',
      properties: {
        input: {type: 'array', items: {}}
      }
    },
    outputSchema: {type: 'array'},
    output: [1, 2, 3]
  }, {
    name: 'Can use referenced items',
    input: {
      items: [1, 2, '/foo'],
      input: {
        foo: 'bar'
      }
    },
    inputSchema: {
      type: 'object',
      properties: {
        input: {type: 'array', items: {}}
      }
    },
    outputSchema: {type: 'array'},
    output: [1, 2, 'bar']
  }, {
    name: 'Can use the special {=: ...} syntax to pass static values',
    input: {
      items: [1, 2, {'=': '/foo'}],
      input: {
        foo: 'bar'
      }
    },
    inputSchema: {
      type: 'object',
      properties: {
        input: {type: 'array', items: {}}
      }
    },
    outputSchema: {type: 'array'},
    output: [1, 2, '/foo']
  }],

  execute: ({items, input}) => {
    return items.map(item => {
      if (typeof item === 'string' && item.startsWith('/')) {
        return get(input, item);
      }
      if (item !== null && typeof item === 'object' && Object.keys(item).length === 1 && Object.keys(item)[0] === '=') {
        return item['='];
      }
      return item;
    });
  }
};
