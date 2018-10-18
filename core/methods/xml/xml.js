'use strict';

module.exports = {
  title: 'To XML',
  description: 'Convert JSON XML representation to XML',

  inputSchema: {
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
  },

  unary: async input => {
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
      return contentXml ? `<${namespaceXml}${tagName}${attributesXml}>${contentXml}</${namespaceXml}${tagName}>` : `<${namespaceXml}${tagName}${attributesXml}/>`;
    };
    return '<?xml version="1.0" encoding="UTF-8">\n' + convert(input);
  }
};
