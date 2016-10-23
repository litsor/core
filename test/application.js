/* eslint-env node, mocha */
'use strict';

const Promise = require('bluebird');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Needle = Promise.promisifyAll(require('needle'));

const Application = require('../classes/Application.js');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('Application', () => {
  let app;

  const uri = 'http://localhost:10023';

  before(() => {
    app = new Application({
      port: 10023,
      storage: {
        modelsDir: 'test/models',
        databases: {
          internal: {
            engine: 'redis',
            host: 'localhost',
            port: 6379,
            prefix: ''
          },
          rethink: {
            engine: 'RethinkDB',
            host: 'localhost',
            port: 28015,
            name: 'test'
          }
        }
      }
    });
    return app.ready();
  });

  after(() => {
    return app.close();
  });

  it('has a GET /graphql endpoint', () => {
    const query = '{listPost{id}}';
    return Needle.getAsync(uri + '/graphql?q=' + encodeURIComponent(query)).then(response => {
      expect(response.statusCode).to.equal(200);
      expect(response.body).to.deep.equal({listPost: []});
    });
  });

  it('has a POST /graphql endpoint', () => {
    const data = {
      query: '{listPost{id}}'
    };
    const options = {
      json: true
    };
    return Needle.postAsync(uri + '/graphql', data, options).then(response => {
      expect(response.statusCode).to.equal(200);
      expect(response.body).to.deep.equal({listPost: []});
    });
  });
});
