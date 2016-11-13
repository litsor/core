'use strict';

const rc = require('rc');
const Application = require('./classes/application');

const config = rc('restapir', {});

const app = new Application(config);

app.ready().then(() => {
  console.log('Listening on port :' + config.port);
});
