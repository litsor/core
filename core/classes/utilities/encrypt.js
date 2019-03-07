'use strict';

const {readFileSync, writeFileSync} = require('fs');
const {createHash, createCipheriv, createDecipheriv, createHmac, randomBytes} = require('crypto');

class Encrypt {
  constructor({Config, Log}) {
    this.key = Config.get('/secret-key', null);
    this.log = Log;
    const configDir = Config.get('/configDir', 'data');
    if (!this.key) {
      try {
        this.key = readFileSync(`${configDir}/secret.key`);
      } catch (err) {
        this.key = randomBytes(32).toString('base64');
        try {
          writeFileSync(`${configDir}/secret.key`, this.key);
          console.log(`A new secret key was generated and stored in ${configDir}/secret.key`);
        } catch (err) {
          this.log.error('No secret key found and unable to write new key');
        }
      }
    }
    if (this.key) {
      this.key = createHash('sha256').update(this.key).digest();
    }
  }

  encrypt(data) {
    try {
      const cipher = createCipheriv('aes256', this.key, null);
      return Buffer.concat([
        cipher.update(JSON.stringify(data)),
        cipher.final()
      ]).toString('base64');
    } catch (err) {
      return false;
    }
  }

  decrypt(data) {
    try {
      const decipher = createDecipheriv('aes256', this.key, null);
      return JSON.parse(Buffer.concat([
        decipher.update(data instanceof Buffer ? data : Buffer.from(data, 'base64')),
        decipher.final()
      ]).toString());
    } catch (err) {
      return false;
    }
  }

  hash(data, returnBuffer = false) {
    return createHash('sha256').update(JSON.stringify(data)).digest(returnBuffer ? null : 'base64');
  }

  hmac(data, returnBuffer = false) {
    return createHmac('sha256', this.key).update(JSON.stringify(data)).digest(returnBuffer ? null : 'base64');
  }
}

Encrypt.singleton = true;
Encrypt.require = ['Config', 'Log'];

module.exports = Encrypt;
