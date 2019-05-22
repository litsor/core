'use strict';

module.exports = {
  title: 'Stream contents',
  description: 'Retrieve full stream as base64',

  inputSchema: {type: 'string'},

  requires: ['Streams'],

  unary: async (code, {Streams}) => {
    const stream = Streams.getStream(code);
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', data => chunks.push(data));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('base64')))
      stream.on('error', reject);
    });
  }
};
