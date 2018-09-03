'use strict';

const {createConnection} = require('net');
const {createInterface} = require('readline');

let data = {};
let script = '';
let syntaxError = null;

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

rl.prompt();

rl.on('line', (line) => {

  script += line + '\n';

  const client = createConnection({ port: 7375 }, () => {
    client.write(JSON.stringify({
      data,
      script
    }));
    client.on('data', result => {
      result = JSON.parse(result.toString());
      if (result.syntaxError) {
        syntaxError = result.syntaxError;
      } else {
        script = '';
        syntaxError = null;
      }
      if (result.runtimeError) {
        console.log(result.runtimeError);
      }
      if (result.unassignedValue) {
        console.log(JSON.stringify(result.unassignedValue, null, 2));
      }
      if (result.data) {
        data = result.data;
      }
      if (!syntaxError) {
        rl.prompt();
      } else {
        process.stdout.write('. ');
      }
    });
  });
}).on('SIGINT', () => {
  if (syntaxError) {
    console.log(syntaxError);
    script = '';
    syntaxError = null;
    rl.prompt();
  } else {
    process.exit(0);
  }
}).on('close', () => {
  process.exit(0);
});
