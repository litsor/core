'use strict';

const {Readable} = require('stream');

module.exports = {
  mockups: {
    Streams: {
      getStream(code) {
        if (code === 'MTIzCg==') {
          const stream = new Readable();
          stream.push(Buffer.from('TG9yZW0gaXBzdW0K', 'base64'));
          stream.push(null);
          return stream;
        }
      }
    }
  },
  tests: [{
    can: 'read stream contents',
    input: 'MTIzCg==',
    output: 'TG9yZW0gaXBzdW0K'
  }]
};
