'use strict';

module.exports = {
  title: 'From obfuscated',
  description: 'Decrypt obfuscated string',

  inputSchema: {type: 'string'},

  requires: ['Encrypt'],

  unary: async (input, {Encrypt}) => {
    const key = Encrypt.hash('obfuscate');

    const cipher = Buffer.from(input.split('-').join('+').split('_').join('/').split('.').join(''), 'base64');

    if (cipher.length < 6) {
      return null;
    }
    let output = '';
    const inputChecksum = cipher.readUInt8(cipher.length - 1) ^ key.charCodeAt(0);
    let checksum = 0;
    for (let i = 0; i < cipher.length - 1; ++i) {
      const char = cipher.readUInt8(i) ^ key.charCodeAt(i % key.length) ^ inputChecksum;
      checksum = (checksum + char) % 256;
      if (char > 0) {
        output += String.fromCharCode(char);
      }
    }

    if (inputChecksum !== checksum) {
      return null;
    }

    return output;
  }
};
