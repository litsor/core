'use strict';

const {createHash, createCipher, createDecipher} = require('crypto');

class Encrypt {
  constructor({Config}) {
    this.key = Config.get('/secret-key', null);
    if (this.key) {
      this.key = createHash('sha256').update(this.key).digest();
    }
  }

  encrypt(data) {
    if (!this.key) {
      throw new Error('Unable to encrypt data. Secret key not set.');
    }
    const cipher = createCipher('aes256', this.key);
    cipher.update(JSON.stringify(data));
    return cipher.final('base64');
  }

  decrypt(data) {
    if (!this.key) {
      throw new Error('Unable to decrypt data. Secret key not set.');
    }
    const decipher = createDecipher('aes256', this.key);
    decipher.update(Buffer.from(data, 'base64'));
    return JSON.parse(decipher.final('latin1'));
  }
}

Encrypt.singleton = true;
Encrypt.require = ['Config'];

module.exports = Encrypt;
