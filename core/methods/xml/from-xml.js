'use strict';

const {Parser} = require('node-expat');

module.exports = {
  title: 'Parse XML',
  description: 'Convert XML to JSON XML representation',
  cache: 0,

  inputSchema: {
    title: 'XML',
    type: 'string'
  },

  defaults: {},

  requires: [],

  tests: [{
    title: 'Can convert single element',
    input: '<?xml version="1.0" encoding="UTF-8">\n<root>test</root>',
    output: {
      tagName: 'root',
      content: 'test'
    }
  }, {
    title: 'Can add attributes',
    input: '<?xml version="1.0" encoding="UTF-8">\n<root bar="baz" foo="bar">test</root>',
    output: {
      tagName: 'root',
      attributes: {
        foo: 'bar',
        bar: 'baz'
      },
      content: 'test'
    }
  }, {
    title: 'Can add namespace',
    input: '<?xml version="1.0" encoding="UTF-8">\n<a:root xmlns:a="http://example.com/a">test</a:root>',
    output: {
      tagName: 'root',
      namespace: 'a',
      attributes: {
        'xmlns:a': 'http://example.com/a'
      },
      content: 'test'
    }
  }, {
    title: 'Can add child elements',
    input: '<?xml version="1.0" encoding="UTF-8">\n<root><name>John</name><age>40</age></root>',
    output: {
      tagName: 'root',
      children: [{
        tagName: 'name',
        content: 'John'
      }, {
        tagName: 'age',
        content: '40'
      }]
    }
  }, {
    title: 'Will use self-closing elements',
    input: '<?xml version="1.0" encoding="UTF-8">\n<root/>',
    output: {
      tagName: 'root'
    }
  }, {
    title: 'Will escape special characters in content',
    input: '<?xml version="1.0" encoding="UTF-8">\n<root>&lt;&quot;Hello &amp; world&quot;&gt;</root>',
    output: {
      tagName: 'root',
      content: '<"Hello & world">'
    }
  }, {
    title: 'Will escape special characters in attributes',
    input: '<?xml version="1.0" encoding="UTF-8">\n<root content="&lt;&quot;Hello &amp; world&quot;&gt;"/>',
    output: {
      tagName: 'root',
      attributes: {
        content: '<"Hello & world">'
      }
    }
  }],

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
