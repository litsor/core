'use strict';

class Application {}

Application.singleton = true;
Application.require = ['GraphqlLinks', 'Endpoints', 'Static'];

module.exports = Application;
