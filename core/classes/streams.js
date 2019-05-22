'use strict';

class Streams {
  constructor({}) {
    this.streams = {};
    this.id = 0;
  }

  registerStream(stream) {
    const id = ++this.id;
    this.streams[id] = {
      stream,
      created: ~~(new Date() / 1e3)
    };
    return Buffer.from(String(id)).toString('base64');
  }

  getStream(code) {
    const id = parseInt(Buffer.from(code, 'base64').toString(), 10);
    if (!this.streams[id]) {
      throw new Error('Stream not found');
    }
    return this.streams[id].stream;
  }

  removeStream(code) {
    const id = parseInt(Buffer.from(code, 'base64').toString(), 10);
    if (!this.streams[id]) {
      throw new Error('Stream not found');
    }
    delete this.streams[id];
  }
}

Streams.singleton = true;
Streams.require = [];

module.exports = Streams;
