'use strict';

const {createServer} = require('net');

class Repl {
  constructor({Script}) {
    this.server = createServer((socket) => {
      socket.on('data', async data => {
        data = JSON.parse(data);
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
      });
    }).on('error', (err) => {
      // handle errors here
      throw err;
    });

    // Provides more readable error messages.
    Script.setId('input');

    this.server.listen(7375);
  }
}

Repl.singleton = true;
Repl.require = ['Script'];

module.exports = Repl;
