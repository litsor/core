'use strict';

const {get} = require('jsonpointer');

module.exports = {
  title: 'Array',
  description: 'Create a new array',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      items: {
        title: 'Input items',
        type: 'array',
        items: {
          title: 'Item'
        }
      },
      input: {
        title: 'Input for referenced items',
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
    title: 'Create new array',
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
    title: 'Can use referenced items',
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
    title: 'Can use the special {=: ...} syntax to pass static values',
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
