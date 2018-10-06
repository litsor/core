'use strict';

const Crypto = require('crypto');
const {promisify} = require('util');

const pbkdf2 = promisify(Crypto.pbkdf2);
const randomBytes = Crypto.randomBytes;

module.exports = {
  title: 'Hash password',
  description: 'Create a hash for storing passwords',

  inputSchema: {
    title: 'Plaintext password',
    type: 'string'
  },

  unary: async password => {
    const version = 1;

    const versionMarker = Buffer.alloc(1);
    versionMarker.writeUInt8(version);

    const salt = randomBytes(16);
    const derivedKey = await pbkdf2(password, salt, 10000, 64, 'sha512');

    const output = Buffer.concat([versionMarker, salt, derivedKey]);

    return output.toString('base64');
  }
};
