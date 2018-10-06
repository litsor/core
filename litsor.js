'use strict';

const Container = require('./core/classes/container');

(async () => {
  const container = new Container();
  await container.startup();
  await container.get('Application');
})();
