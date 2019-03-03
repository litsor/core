/* eslint-env node, mocha */
'use strict';

const chai = require('chai');

const Container = require('../classes/container');

const expect = chai.expect;

describe('Performance', () => {
  let container;
  let testUrl;
  let scriptsManager;
  let db;

  before(async () => {
    container = new Container();
    await container.startup();

    const config = await container.get('Config');
    config.set({
      port: 1234,
      configDir: 'core/test/performance',
      database: process.env.LITSOR_DATABASE || 'mysql:root:password@127.0.0.1/litsor',
      'recreate-db': true,
      'secret-key': 'test'
    });
    testUrl = 'http://127.0.0.1:1234';
    await container.get('Endpoints');
    await container.get('GraphqlLinks');

    db = await container.get('Database');

    scriptsManager = await container.get('ScriptsManager');
  });

  after(async () => {
    await container.shutdown();
  });

  it('can execute 10k map iterations in < 1s', async () => {
    const script = scriptsManager.get('TestMap');
    const input = [];
    for (let i = 0; i < 1e4; ++i) {
      input.push(i);
    }
    const start = new Date();
    await script.run({input});
    const time = new Date() - start;
    expect(time < 1000).to.equal(true);
  });
});
