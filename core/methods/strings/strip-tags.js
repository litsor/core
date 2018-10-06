'use strict';

const striptags = require('striptags');

module.exports = {
  name: 'Strip tags',
  inputSchema: {
    title: 'HTML',
    type: 'string'
  },
  leftSchema: {
    title: 'HTML',
    type: 'string'
  },
  rightSchema: {
    title: 'Allowed tags',
    type: 'array',
    items: {
      title: 'Tagname',
      type: 'string'
    }
  },
  requires: [],
  tests: [],
  binary: (html, allowedTags) => {
    return striptags(html, allowedTags);
  },
  unary: html => striptags(html)
};
