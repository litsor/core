'use strict';

module.exports = {
  title: 'Signature',
  description: 'Generate HS256 signature',

  inputSchema: {type: 'string'},

  requires: ['Encrypt'],

  unary: async (input, {Encrypt}) => {
    return Encrypt.hmac(input);
  }
};
