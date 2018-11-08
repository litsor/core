'use strict';

const {createCipher, createHmac} = require('crypto');

module.exports = {
  mockups: {
    Encrypt: {
      encrypt(data) {
        const cipher = createCipher('aes256', 'secret key');
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
    output: 'kxLpAXLdF1hXVASjpoaD1PNNmdPD2x63F2MLKqgOIXvQATwDW7qBhytBTGMgO4VN'
  }],
};
