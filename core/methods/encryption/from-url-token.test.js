'use strict';

const {createDecipher, createHmac} = require('crypto');

module.exports = {
  mockups: {
    Encrypt: {
      decrypt(data) {
        const decipher = createDecipher('aes256', 'secret key');
        return JSON.parse(Buffer.concat([
          decipher.update(data instanceof Buffer ? data : Buffer.from(data, 'base64')),
          decipher.final()
        ]).toString());
      },
      hmac(data) {
        return createHmac('sha256', 'secret key').update(JSON.stringify(data)).digest('base64');
      }
    }
  },

  tests: [{
    can: 'Can decrypt token',
    input: 'kxLpAXLdF1hXVASjpoaD1PNNmdPD2x63F2MLKqgOIXvQATwDW7qBhytBTGMgO4VN',
    output: {id: '34'}
  }],
};
