/* eslint-env node, mocha */
'use strict';

const {stringify} = require('querystring');
const {resolve, parse} = require('url');
const chai = require('chai');
const fetch = require('node-fetch');
const {JSDOM} = require('jsdom');
const parseForm = require('form-parse');
const add1 = require('./scripts-manager/methods/add1');

const Container = require('../classes/container');

const expect = chai.expect;

describe('Scripts manager', () => {
  const temporary = {};
  let container;
  let testUrl;
  let scriptsManager;

  before(async () => {
    add1.reset();

    container = new Container();
    await container.startup();

    const config = await container.get('Config');
    config.set({
      port: 1234,
      configDir: 'core/test/scripts-manager',
      methodsDir: 'core/test/scripts-manager/methods',
      database: 'mysql:root:password@127.0.0.1/restapir',
      'recreate-db': true,
      'secret-key': 'test'
    });
    testUrl = 'http://127.0.0.1:1234';
    await container.get('Endpoints');
    await container.get('GraphqlLinks');

    scriptsManager = await container.get('ScriptsManager');
  });

  after(async () => {
    await container.shutdown();
  });

  it('will run scripts on startup', async () => {
    await new Promise(resolve => setInterval(resolve, 500));
    expect(add1.getValue('startup')).to.equal(1);
  });

  it('will run cron', async () => {
    const before = add1.getValue('cron');
    await new Promise(resolve => setInterval(resolve, 1010));
    const after = add1.getValue('cron');
    expect(after > before).to.equal(true);
  });
});
