'use strict';

const Handlebars = require('handlebars');

Handlebars.registerHelper('encode', encodeURIComponent);
Handlebars.registerHelper('base64', str => Buffer.from(str).toString('base64'));
Handlebars.registerHelper('json', input => JSON.stringify(input));

module.exports = {
  title: 'Handlebars',
  description: 'Render handlebars HTML template',

  leftSchema: {
    title: 'Input variables',
    type: 'object'
  },

  rightSchema: {
    title: 'Handlebars template',
    type: 'string'
  },

  binary: (variables, template) => {
    const render = Handlebars.compile(template);
    return render(variables);
  }
};
