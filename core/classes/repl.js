'use strict';

const {createServer} = require('net');

class Repl {
  constructor({Script}) {
    this.server = createServer((socket) => {
      let buffer = Buffer.alloc(0);
      socket.on('data', async data => {
        buffer = Buffer.concat([buffer, data]);
        try {
          data = JSON.parse(buffer.toString());
          buffer = Buffer.alloc(0);
          const result = {};
          try {
            Script.load(data.script);
            try {
              const context = await Script.run(data.data, {returnContext: true});
              result.data = context.data;
              if (typeof context.unassignedValue !== 'undefined') {
                result.unassignedValue = context.unassignedValue;
              }
            } catch (err) {
              result.runtimeError = err.message;
            }
          } catch (err) {
            result.syntaxError = err.message;
          }
          socket.end(JSON.stringify(result));
        } catch (err) {
          // Data is not complete yet.
        }
      });
    }).on('error', (err) => {
      // handle errors here
      throw err;
    });

    // Name is visible in exported statistics.
    Script.setId('repl');

    this.server.listen(7375);
  }
}

Repl.singleton = true;
Repl.require = ['Script'];

module.exports = Repl;
