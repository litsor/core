'use strict';

const Handlebars = require('handlebars');

Handlebars.registerHelper('encode', encodeURIComponent);
Handlebars.registerHelper('base64', str => Buffer.from(str).toString('base64'));

module.exports = {
  name: 'Handlebars',
  description: 'Render handlebars HTML template',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      template: {
        name: 'Handlebars template',
        type: 'string'
      }
    },
    required: ['template'],
    additionalProperties: {
      name: 'Render variables'
    }
  },

  outputSchema: () => {
    return {
      type: 'string'
    };
  },

  requires: [],

  tests: [{
    name: 'Render basic template',
    input: {
      template: '<h1>{{title}}</h1>',
      title: 'Hello world'
    },
    outputSchema: {type: 'string'},
    output: '<h1>Hello world</h1>'
  }, {
    name: 'Render URL',
    input: {
      template: 'http://example.com/?code={{encode code}}',
      code: 'Foo&bar'
    },
    outputSchema: {type: 'string'},
    output: 'http://example.com/?code=Foo%26bar'
  }],

  execute: ({template, ...variables}) => {
    const render = Handlebars.compile(template);
    return render(variables);
  }
};
