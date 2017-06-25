'use strict';

const Container = require('./classes/container');

(async () => {
  const container = new Container();
  await container.startup();
  await container.get('Application');
  console.log('Restapir is running');
})();
