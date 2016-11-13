'use strict';

const spawn = require('child_process').spawn;
const Watch = require('watch');
const Chalk = require('chalk');

// Global booleans to keep track of running processes.
let killed = false;

// NodeJS process.
let api = null;

const watchCallback = function() {
  if (api !== null) {
    if (!killed) {
      console.log(Chalk.blue('Killing application'));
      api.kill();
      killed = true;
    }
    return;
  }
  console.log(Chalk.blue('Starting application'));
  try {
    api = spawn('npm', ['test'], {stdio: 'inherit'});
  } catch (err) {
    console.error(err);
    return;
  }
  killed = false;
  api.on('close', () => {
    api = null;
    if (killed) {
      killed = false;
      setImmediate(() => {
        watchCallback();
      });
    }
  });
};

Watch.watchTree('classes', {interval: 1}, watchCallback);
Watch.watchTree('test', {interval: 1}, watchCallback);
Watch.watchTree('engines', {interval: 1}, watchCallback);
Watch.watchTree('plugins', {interval: 1}, watchCallback);
