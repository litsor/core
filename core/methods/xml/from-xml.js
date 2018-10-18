'use strict';

const {Parser} = require('node-expat');

module.exports = {
  title: 'Parse XML',
  description: 'Convert XML to JSON XML representation',

  inputSchema: {
    title: 'XML',
    type: 'string'
  },

  unary: async input => {
    if (input.startsWith('<?xml')) {
      input = input.replace(/<\?xml[^>]+>/, '');
    }

    const base = {};
    const parser = new Parser('UTF-8');

    const stack = [base];

    parser.on('startElement', (name, attrs) => {
      const pointer = stack[stack.length - 1];
      if (!pointer.children) {
        pointer.children = [];
      }
      const element = {};
      pointer.children.push(element);
      stack.push(element);

      const parts = name.split(':');
      if (parts.length > 1) {
        name = parts[1];
        element.namespace = parts[0];
      }
      element.tagName = name;
      if (Object.keys(attrs).length > 0) {
        element.attributes = attrs;
      }
    });
    parser.on('endElement', () => {
      stack.pop();
    });
    parser.on('text', text => {
      const pointer = stack[stack.length - 1];
      pointer.content = (pointer.content || '') + text;
    });
    parser.on('error', error => {
      throw new Error('Parse error in XML: ' + error);
    });

    const result = parser.write(input);
    if (!result) {
      throw new Error('Parse error in XML');
    }

    return base.children[0];
  }
};
