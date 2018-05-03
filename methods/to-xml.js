'use strict';

module.exports = {
  title: 'To XML',
  description: 'Convert JSON XML representation to XML',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      input: {
        title: 'JSON XML representation',
        type: 'object',
        properties: {
          tagName: {
            title: 'Tagname',
            type: 'string'
          },
          namespace: {
            title: 'Namespace URI',
            type: 'string'
          },
          attributes: {
            title: 'Attributes',
            type: 'object',
            additionalProperties: {
              title: 'Value',
              type: 'string'
            }
          },
          children: {
            title: 'Child elements',
            type: 'array',
            items: {
              title: 'Element',
              $ref: '#/definitions/methods/to-xml/properties/input'
            }
          },
          content: {
            title: 'Tag content',
            type: 'string'
          }
        },
        required: ['tagName'],
        additionalProperties: false
      }
    },
    required: ['input'],
    additionalProperties: false
  },

  defaults: {},

  outputSchema: () => {
    return {
      type: 'string'
    };
  },

  requires: [],

  tests: [{
    title: 'Can convert single element',
    input: {
      input: {
        tagName: 'root',
        content: 'test'
      }
    },
    output: '<?xml version="1.0" encoding="UTF-8">\n<root>test</root>',
    outputSchema: {type: 'string'}
  }, {
    title: 'Can add attributes',
    input: {
      input: {
        tagName: 'root',
        attributes: {
          foo: 'bar',
          bar: 'baz'
        },
        content: 'test'
      }
    },
    // Note that attributes are sorted.
    output: '<?xml version="1.0" encoding="UTF-8">\n<root bar="baz" foo="bar">test</root>',
    outputSchema: {type: 'string'}
  }, {
    title: 'Can add namespace',
    input: {
      input: {
        tagName: 'root',
        namespace: 'a',
        attributes: {
          'xmlns:a': 'http://example.com/a'
        },
        content: 'test'
      }
    },
    // Note that attributes are sorted.
    output: '<?xml version="1.0" encoding="UTF-8">\n<a:root xmlns:a="http://example.com/a">test</root>',
    outputSchema: {type: 'string'}
  }, {
    title: 'Can add child elements',
    input: {
      input: {
        tagName: 'root',
        children: [{
          tagName: 'name',
          content: 'John'
        }, {
          tagName: 'age',
          content: '40'
        }]
      }
    },
    // Note that attributes are sorted.
    output: '<?xml version="1.0" encoding="UTF-8">\n<root><name>John</name><age>40</age></root>',
    outputSchema: {type: 'string'}
  }, {
    title: 'Will use self-closing elements',
    input: {
      input: {
        tagName: 'root'
      }
    },
    // Note that attributes are sorted.
    output: '<?xml version="1.0" encoding="UTF-8">\n<root/>',
    outputSchema: {type: 'string'}
  }, {
    title: 'Will escape special characters in content',
    input: {
      input: {
        tagName: 'root',
        content: '<"Hello & world">'
      }
    },
    // Note that attributes are sorted.
    output: '<?xml version="1.0" encoding="UTF-8">\n<root>&lt;&quot;Hello &amp; world&quot;&gt;</root>',
    outputSchema: {type: 'string'}
  }, {
    title: 'Will escape special characters in attributes',
    input: {
      input: {
        tagName: 'root',
        attributes: {
          content: '<"Hello & world">'
        }
      }
    },
    // Note that attributes are sorted.
    output: '<?xml version="1.0" encoding="UTF-8">\n<root content="&lt;&quot;Hello &amp; world&quot;&gt;"/>',
    outputSchema: {type: 'string'}
  }],

  execute: async ({input}) => {
    const escape = string => (string || '').split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');
    const convert = element => {
      const {tagName, namespace, attributes, children, content} = {
        namespace: null,
        attributes: {},
        children: [],
        content: null,
        ...element
      };
      const namespaceXml = namespace ? `${namespace}:` : '';
      const attributesXml = Object.keys(attributes).sort().map(name => ` ${name}="${escape(attributes[name])}"`).join('');
      const contentXml = children.map(convert).join('') + escape(content);
      return contentXml ? `<${namespaceXml}${tagName}${attributesXml}>${contentXml}</${tagName}>` : `<${tagName}${attributesXml}/>`;
    };
    return '<?xml version="1.0" encoding="UTF-8">\n' + convert(input);
  }
};
