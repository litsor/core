'use strict';

module.exports = {
  title: 'Close stream',
  description: 'Close a stream',

  inputSchema: {type: 'string'},

  requires: ['Streams'],

  unary: async (code, {Streams}) => {
    Streams.getStream(code).close();
    return null;
  }
};
