'use strict';

module.exports = {
  title: 'Obfuscated',
  description: 'Weak encryption for obfuscation',

  inputSchema: {type: 'string'},

  requires: ['Encrypt'],

  unary: async (input, {Encrypt}) => {
    // Do not use the secret key directly to avoid leaking it due to the weak encryption.
    const key = Encrypt.hash('obfuscate');

    // Pad the string to not reveal the length for small strings.
    const base = input.length >= 5 ? input : (input + '\0\0\0\0\0').substring(0, 5);

    // Generate the checksum.
    let checksum = 0;
    for (let i = 0; i < base.length; ++i) {
      checksum = (checksum + base.charCodeAt(i)) % 256;
    }

    // Generate the output. Xor with checksum and key.
    const output = Buffer.alloc(base.length + 1);
    for (let i = 0; i < base.length; ++i) {
      output.writeUInt8(base.charCodeAt(i) ^ checksum ^ key.charCodeAt(i % key.length), i);
    }

    // Append output with checksum.
    output.writeUInt8(checksum ^ key.charCodeAt(0), base.length);

    return output.toString('base64').split('+').join('-').split('/').join('_').split('=').join('');
  }
};
