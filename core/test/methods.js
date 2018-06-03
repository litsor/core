/* eslint-env node, mocha */
'use strict';

const chai = require('chai');
const globby = require('globby');

const Container = require('../classes/container');

const expect = chai.expect;

describe.skip('Methods', () => {
  let container;
  let Methods;
  let MethodTester;

  before(async () => {
    container = new Container();
    await container.startup();

    const config = await container.get('Config');
    config.set({
      port: 1234,
      configDir: 'test/oauth',
      database: 'mysql:root:password@127.0.0.1/restapir',
      'recreate-db': true,
      'secret-key': 'test'
    });
    await container.get('Endpoints');

    Methods = await container.get('Methods');
    MethodTester = await container.get('MethodTester');
  });

  after(async () => {
    await container.shutdown();
  });

  globby.sync('core/methods/**/*.js').forEach(filename => {
    const name = filename.match(/\/([^/]+)\.js$/)[1];
    it(name, async () => {
      const method = await Methods.get(name);
      if (method.tests.length === 0) {
        throw new Error(`Method ${name} does not have any tests`);
      }
      const passed = await MethodTester.test(method, true);
      expect(passed).to.equal(true);
    });
  });
});
