'use strict';

class Application {
  constructor({Log}) {
    this.log = Log;
  }

  async startup() {
    this.log.info('Litsor is running');
  }
}

Application.singleton = true;
Application.require = ['GraphqlLinks', 'Endpoints', 'Static', 'Log', 'Repl'];

module.exports = Application;
