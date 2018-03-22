'use strict';

const Crypto = require('crypto');
const {promisify} = require('util');

const pbkdf2 = promisify(Crypto.pbkdf2);
const randomBytes = Crypto.randomBytes;

module.exports = {
  name: 'Hash password',
  description: 'Create a hash for storing passwords',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      password: {
        name: 'Plaintext password',
        type: 'string',
        minLength: 1
      }
    },
    required: [],
    additionalProperties: false
  },

  outputSchema: () => {
    return {
      type: 'string',
      minLength: 108,
      maxLength: 108
    };
  },

  requires: [],

  tests: [{
    name: 'Can generate hash',
    input: {
      password: 'Welcome01!!'
    },
    output: async data => {
      // The result will be 81 bytes; 1 for the version, 16 for salt and 64 for the derived key.
      // In base64 this will be 81 * (8/6) = 108 bytes, which is dividable by 4, so no padding
      // will be added.
      if (data.length !== 108) {
        return false;
      }
      const password = 'Welcome01!!';
      const salt = Buffer.from(data, 'base64').slice(1, 17);
      const derivedKey = Buffer.from(data, 'base64').slice(17);
      const regenerated = await pbkdf2(password, salt, 10000, 64, 'sha512');
      return regenerated.toString('hex') === derivedKey.toString('hex');
    }
  }],

  execute: async ({password}) => {
    const version = 1;

    const versionMarker = Buffer.alloc(1);
    versionMarker.writeUInt8(version);

    const salt = randomBytes(16);
    const derivedKey = await pbkdf2(password, salt, 10000, 64, 'sha512');

    const output = Buffer.concat([versionMarker, salt, derivedKey]);

    return output.toString('base64');
  }
};
