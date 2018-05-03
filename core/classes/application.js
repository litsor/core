'use strict';

class Application {}

Application.singleton = true;
Application.require = ['GraphqlLinks', 'Endpoints'];

module.exports = Application;
