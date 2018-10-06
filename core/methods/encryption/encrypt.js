'use strict';

module.exports = {
  title: 'Encrypt',
  description: 'Encrypt data',

  inputSchema: {type: 'string'},

  requires: ['Encrypt'],

  unary: async (input, {Encrypt}) => {
    return Encrypt.encrypt(input);
  }
};
