'use strict';

module.exports = {
  title: 'Url token',
  description: 'Encrypt and sign data for use in URL',

  inputSchema: {},

  requires: ['Encrypt'],

  unary: async (input, {Encrypt}) => {
    return Buffer.concat([
      Encrypt.hmac(input, true),
      Encrypt.encrypt(input, true)
    ]).toString('base64').split('+').join('-').split('/').join('_').split('=').join('');
  }
};
