/* eslint-env node, mocha */
'use strict';

const chai = require('chai');

const Container = require('../classes/container');
const add1 = require('./scripts-manager/methods/add1');

const expect = chai.expect;

describe('Scripts manager', () => {
  let container;

  before(async () => {
    add1.reset();

    container = new Container();
    await container.startup();

    const config = await container.get('Config');
    config.set({
      port: 1234,
      configDir: 'core/test/scripts-manager',
      methodsDir: 'core/test/scripts-manager/methods',
      database: process.env.LITSOR_DATABASE || 'mysql:root:password@127.0.0.1/litsor',
      'recreate-db': true,
      'secret-key': 'test'
    });
    await container.get('Endpoints');
    await container.get('GraphqlLinks');
    await container.get('ScriptsManager');
  });

  after(async () => {
    await container.shutdown();
  });

  it('will run scripts on startup', async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    expect(add1.getValue('startup')).to.equal(1);
  });

  it('will run cron', async () => {
    const before = add1.getValue('cron');
    await new Promise(resolve => setTimeout(resolve, 1010));
    const after = add1.getValue('cron');
    expect(after > before).to.equal(true);
  });
});
