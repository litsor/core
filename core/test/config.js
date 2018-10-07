/* eslint-env node, mocha */
/* eslint-disable no-await-in-loop */
'use strict';

const chai = require('chai');

const Container = require('../classes/container');

const expect = chai.expect;

describe('Config', () => {
  let container;
  let config;

  before(async () => {
    container = new Container();
    await container.startup();

    config = await container.get('Config');
    config.set({
      port: 1234,
      configDir: 'data',
      database: 'mysql:root:password@127.0.0.1/litsor',
      'recreate-db': true,
      'secret-key': 'test'
    });
  });

  after(async () => {
    await container.shutdown();
  });

  it('can get complete config', async () => {
    expect(config.get()).to.have.property('port', 1234);
  });

  it('can get single entry from config', async () => {
    expect(config.get('/port')).to.equal(1234);
  });
});
