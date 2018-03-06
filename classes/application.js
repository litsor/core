'use strict';

class Application {}

Application.singleton = true;
Application.require = ['GraphqlLinks', 'Models'];

module.exports = Application;
