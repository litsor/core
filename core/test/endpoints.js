/* eslint-env node, mocha */
'use strict';

const fetch = require('node-fetch');
const chai = require('chai');

const Container = require('../classes/container');

const expect = chai.expect;

describe('Endpoints', () => {
  let container;

  before(async () => {
    container = new Container();
    await container.startup();

    const config = await container.get('Config');
    config.set({
      port: 1234,
      configDir: 'core/test/endpoints',
      methodsDir: 'core/test/endpoints/methods',
      database: 'mysql:root:password@127.0.0.1/restapir',
      'recreate-db': true,
      'secret-key': 'test'
    });
    await container.get('Endpoints');
    await container.get('GraphqlLinks');
    await container.get('ScriptsManager');

    // Wait for the endpoints to load.
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  after(async () => {
    await container.shutdown();
  });

  it('can get HTML page', async () => {
    const result = await fetch('http://localhost:1234/html-page', {
      headers: {Accept: 'text/html'}
    });
    const body = await result.text();
    expect(body).to.contain('Hello world');
    const contentLength = result.headers.get('Content-Length');
    expect(parseInt(contentLength)).to.equal(body.length);
    const contentType = result.headers.get('Content-Type');
    expect(contentType).to.equal('text/html; charset=utf-8');
  });
});
