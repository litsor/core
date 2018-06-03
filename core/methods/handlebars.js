'use strict';

const Handlebars = require('handlebars');

Handlebars.registerHelper('encode', encodeURIComponent);
Handlebars.registerHelper('base64', str => Buffer.from(str).toString('base64'));

module.exports = {
  title: 'Handlebars',
  description: 'Render handlebars HTML template',
  isBinary: true,
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      template: {
        title: 'Handlebars template',
        type: 'string'
      }
    },
    required: ['template'],
    additionalProperties: {
      title: 'Render variables'
    }
  },

  outputSchema: () => {
    return {
      type: 'string'
    };
  },

  requires: [],

  tests: [{
    title: 'Render basic template',
    input: {
      template: '<h1>{{title}}</h1>',
      title: 'Hello world'
    },
    outputSchema: {type: 'string'},
    output: '<h1>Hello world</h1>'
  }, {
    title: 'Render URL',
    input: {
      template: 'http://example.com/?code={{encode code}}',
      code: 'Foo&bar'
    },
    outputSchema: {type: 'string'},
    output: 'http://example.com/?code=Foo%26bar'
  }],

  binary: (variables, template) => {
    const render = Handlebars.compile(template);
    return render(variables);
  }
};
