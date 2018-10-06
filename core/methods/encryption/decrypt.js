'use strict';

module.exports = {
  title: 'Decrypt',
  description: 'Decrypt data',

  inputSchema: {type: 'string'},

  requires: ['Encrypt'],

  unary: async (input, {Encrypt}) => {
    return Encrypt.decrypt(input);
  }
};
