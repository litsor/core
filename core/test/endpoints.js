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
      database: process.env.LITSOR_DATABASE || 'mysql:root:password@127.0.0.1/litsor',
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

  it('accepts path arguments', async () => {
    const result = await fetch('http://localhost:1234/item/123', {
      headers: {Accept: 'application/json'}
    });
    const body = await result.json();
    expect(body).to.have.property('id', '123');
  });

  it('accepts query arguments', async () => {
    const result = await fetch('http://localhost:1234/item?title=Test&limit=10&unpublished=true', {
      headers: {Accept: 'application/json'}
    });
    const body = await result.json();
    expect(body).to.have.property('title', 'Test');
    expect(body).to.have.property('limit', 10);
    expect(body).to.have.property('unpublished', true);
  });

  it('accepts body arguments from formdata', async () => {
    const result = await fetch('http://localhost:1234/item/123', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'title=Hello%20world'
    });
    const body = await result.json();
    expect(body).to.have.property('title', 'Hello world');
  });

  it('accepts body arguments from json body', async () => {
    const result = await fetch('http://localhost:1234/item/123', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: '{"title":"Hello world"}'
    });
    const body = await result.json();
    expect(body).to.have.property('title', 'Hello world');
  });
});
