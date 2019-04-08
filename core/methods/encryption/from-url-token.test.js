'use strict';

const {createDecipheriv, createHmac, createHash} = require('crypto');

module.exports = {
  mockups: {
    Encrypt: {
      decrypt(data) {
        const key = createHash('sha256').update('secret key').digest();
        const iv = Buffer.alloc(16);
        const decipher = createDecipheriv('aes256', key, iv);
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
    input: 'kxLpAXLdF1hXVASjpoaD1PNNmdPD2x63F2MLKqgOIXvFZYzU3iv-TEe4Td5cVYoT',
    output: {id: '34'}
  }],
};
