'use strict';

const {createWriteStream} = require('fs');

module.exports = {
  title: 'File write stream',
  description: 'Create stream to write file',

  inputSchema: {type: 'string'},

  requires: ['Streams'],

  unary: async (filename, {Streams}) => {
    const stream = createWriteStream(filename);
    return Streams.registerStream(stream);
  }
};
