'use strict';

module.exports = {
  title: 'Pipe to',
  description: 'Pipe stream to another stream',

  leftSchema: {type: 'string'},
  rightSchema: {type: 'string'},

  requires: ['Streams'],

  binary: async (fromId, toId, {Streams}) => {
    const from = Streams.getStream(fromId);
    const to = Streams.getStream(toId);
    from.pipe(to);
    return null;
  }
};
