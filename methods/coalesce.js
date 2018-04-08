'use strict';

const {get} = require('jsonpointer');

module.exports = {
  title: 'Coalesce',
  description: 'Returns the first non-empty item in the list',
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
    return {};
  },

  requires: [],

  tests: [{
    title: 'Get first non-empty item',
    input: {
      items: [null, 2, 3]
    },
    output: 2
  }, {
    title: 'Can use referenced items',
    input: {
      items: ['/foo'],
      input: {
        foo: 'bar'
      }
    },
    output: 'bar'
  }, {
    title: 'Does not return empty referenced items',
    input: {
      items: ['/foo', '/bar'],
      input: {
        bar: 'baz'
      }
    },
    output: 'baz'
  }, {
    title: 'Can use the special {=: ...} syntax to pass static values',
    input: {
      items: [{'=': '/foo'}],
      input: {
        foo: 'bar'
      }
    },
    output: '/foo'
  }],

  execute: ({items, input}) => {
    return items.reduce((prev, item) => {
      if (typeof item === 'string' && item.startsWith('/')) {
        return prev || get(input, item);
      }
      if (item !== null && typeof item === 'object' && Object.keys(item).length === 1 && Object.keys(item)[0] === '=') {
        return prev || item['='];
      }
      return prev || item;
    }, null);
  }
};
