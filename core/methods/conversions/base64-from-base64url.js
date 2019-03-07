'use strict';

module.exports = {
  id: 'base64FromBase64url',
  title: 'Base64 from base64url',
  description: 'Recode base64url to base64',

  inputSchema: {
    title: 'Input string',
    type: 'string'
  },

  requires: [],

  unary: operand => {
    operand = operand.split('-').join('+').split('_').join('/').split('.').join('');
    const length = operand.length;
    if (length % 4) {
      operand += '===='.substring(length % 4);
    }
    return operand;
  }
};
