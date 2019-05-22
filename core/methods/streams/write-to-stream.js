'use strict';

module.exports = {
  title: 'Write to stream',
  description: 'Write base64 data to stream',

  leftSchema: {type: 'string'},
  rightSchema: {type: 'string'},

  requires: ['Streams'],

  binary: async (contents, code, {Streams}) => {
    Streams.getStream(code).write(Buffer.from(contents, 'base64'));
    return null;
  }
};
