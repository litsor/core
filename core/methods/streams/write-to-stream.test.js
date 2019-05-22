'use strict';

const {Writable} = require('stream');

class DummyStream extends Writable {
  _write() {}
}

module.exports = {
  mockups: {
    Streams: {
      getStream(code) {
        if (code === 'MTIzCg==') {
          const stream = new DummyStream();
          return stream;
        }
      }
    }
  },
  tests: [{
    can: 'write stream contents',
    left: 'TG9yZW0gaXBzdW0K',
    right: 'MTIzCg==',
    output: null
  }]
};
