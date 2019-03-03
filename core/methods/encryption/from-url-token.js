'use strict';

module.exports = {
  title: 'From url token',
  description: 'Decrypt and verify url token',

  inputSchema: {
    type: 'string',
    minLength: 43
  },

  requires: ['Encrypt', 'Immutable'],

  unary: async (input, {Encrypt, Immutable}) => {
    const inputData = Buffer.from(input.split('-').join('+').split('_').join('/').split('.').join(''), 'base64');
    const hash = inputData.slice(0, 32);
    const data = Encrypt.decrypt(inputData.slice(32));
    if (hash.toString('base64') !== Encrypt.hmac(data)) {
      return null;
    }
    return Immutable.fromJS(data);
  }
};
