'use strict';

const Rc = require('rc');
const Application = require('./classes/Application');

const config = Rc('restapir', {});

let app = new Application(config);
app.ready.then(() => {
  console.log('Listening on port :' + config.port);
});
