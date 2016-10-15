"use strict";

const Watch = require('watch');
const Chalk = require('Chalk');
const Spawn = require('child_process').spawn;

// Global booleans to keep track of running processes.
var taskRunning = false;
var killed = false;

// NodeJS process.
var api = null;
var restartCount = 0;

var watchCallback = function() {
  if (api !== null) {
    if (!killed) {
      console.log(Chalk.blue('Killing application'));
      api.kill();
      killed = true;
    }
    return;
  }
  ++restartCount;
  console.log(Chalk.blue('Starting application'));
  try {
    api = Spawn('npm', ['test'], {stdio: 'inherit'});
  }
  catch (e) {
    console.error(e);
    return;
  }
  killed = false;
  api.on('close', (code) => {
    api = null;
    if (killed) {
      killed = false;
      setImmediate(function() {
        watchCallback();
      });
    }
  });
};

Watch.watchTree('classes', {interval: 1}, watchCallback);
Watch.watchTree('test', {interval: 1}, watchCallback);
Watch.watchTree('engines', {interval: 1}, watchCallback);
Watch.watchTree('plugins', {interval: 1}, watchCallback);
