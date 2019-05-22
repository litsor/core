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

    let resolve;
    let reject;
    const defer = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });

    from.pipe(to);
    from.on('finish', resolve);
    from.on('close', resolve);
    from.on('error', reject);
    await defer;

    return null;
  }
};
