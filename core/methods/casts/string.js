'use strict';

module.exports = {
  title: 'Cast to string',
  description: 'Convert number, boolean or null to string',

  inputSchema: {
    oneOf: [{
      title: 'Number',
      type: 'number'
    }, {
      title: 'Boolean',
      type: 'boolean'
    }, {
      title: 'Null',
      type: 'null'
    }]
  },

  unary: input => String(input)
};
