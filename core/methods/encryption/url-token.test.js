'use strict';

const {createCipheriv, createHmac, createHash} = require('crypto');

module.exports = {
  mockups: {
    Encrypt: {
      encrypt(data) {
        const key = createHash('sha256').update('secret key').digest();
        const iv = Buffer.alloc(16);
        const cipher = createCipheriv('aes256', key, iv);
        return Buffer.concat([
          cipher.update(JSON.stringify(data)),
          cipher.final()
        ]);
      },
      hmac(data) {
        return createHmac('sha256', 'secret key').update(JSON.stringify(data)).digest();
      }
    }
  },

  tests: [{
    can: 'Can construct token',
    input: {id: '34'},
    output: 'kxLpAXLdF1hXVASjpoaD1PNNmdPD2x63F2MLKqgOIXvFZYzU3iv-TEe4Td5cVYoT'
  }],
};
