'use strict';

module.exports = {
  id: 'base64urlFromBase64',
  title: 'Base64url from base64',
  description: 'Recode base64 to base64url',

  inputSchema: {
    title: 'Input string',
    type: 'string'
  },

  requires: [],

  unary: operand => operand.split('+').join('-').split('/').join('_').split('=').join('')
};
