'use strict';

module.exports = {
  tests: [{
    can: 'render basic template',
    left: {
      title: 'Hello world'
    },
    right: '<h1>{{title}}</h1>',
    output: '<h1>Hello world</h1>'
  }, {
    can: 'render URL',
    left: {
      code: 'Foo&bar'
    },
    right: 'http://example.com/?code={{encode code}}',
    output: 'http://example.com/?code=Foo%26bar'
  }]
};
