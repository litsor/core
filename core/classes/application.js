'use strict';

class Application {
  constructor({Log}) {
    this.log = Log;
  }

  async startup() {
    this.log.info('Restapir is running');
  }
}

Application.singleton = true;
Application.require = ['GraphqlLinks', 'Endpoints', 'Static', 'Log'];

module.exports = Application;
