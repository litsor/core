'use strict';

const {createReadStream} = require('fs');

module.exports = {
  title: 'File read stream',
  description: 'Create stream to read file',

  inputSchema: {type: 'string'},

  requires: ['Streams'],

  unary: async (filename, {Streams}) => {
    const stream = createReadStream(filename);
    return Streams.registerStream(stream);
  }
};
