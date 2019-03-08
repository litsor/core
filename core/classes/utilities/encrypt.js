'use strict';

const {readFileSync, writeFileSync} = require('fs');
const {createHash, createCipheriv, createDecipheriv, createHmac, randomBytes} = require('crypto');

class Encrypt {
  constructor({Config, Log}) {
    this.key = null;
    const configKey = Config.get('/secret-key', null);
    if (configKey) {
      this.key = createHash('sha256').update(configKey).digest();
    }
    this.log = Log;
    const configDir = Config.get('/configDir', 'data');
    if (!this.key) {
      try {
        this.key = readFileSync(`${configDir}/secret.key`);
        this.key = Buffer.from(this.key, 'base64');
        if (this.key.byteLength !== 32) {
          this.key = createHash('sha256').update(this.key).digest();
        }
      } catch (err) {
        this.key = randomBytes(32);
        try {
          writeFileSync(`${configDir}/secret.key`, this.key);
          console.log(`A new secret key was generated and stored in ${configDir}/secret.key`);
        } catch (err) {
          this.log.error('No secret key found and unable to write new key');
        }
      }
    }
  }

  encrypt(data) {
    try {
      const iv = randomBytes(16);
      const cipher = createCipheriv('aes-256-cbc', this.key, iv);
      return Buffer.concat([
        iv,
        cipher.update(JSON.stringify(data)),
        cipher.final()
      ]).toString('base64');
    } catch (err) {
      return false;
    }
  }

  decrypt(data) {
    try {
      data = data instanceof Buffer ? data : Buffer.from(data, 'base64');
      const iv = data.slice(0, 16);
      const cipher = data.slice(16);
      const decipher = createDecipheriv('aes-256-cbc', this.key, iv);
      return JSON.parse(Buffer.concat([
        decipher.update(cipher),
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
