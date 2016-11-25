/* eslint-env node, mocha */
'use strict';

const Bluebird = require('bluebird');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Needle = Bluebird.promisifyAll(require('needle'));
const Lokka = require('lokka-transport-http').Transport;

const Application = require('../classes/application');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('Application', () => {
  let app;

  const uri = 'http://localhost:10023';

  before(() => {
    app = new Application({
      port: 10023,
      storage: {
        modelsDir: 'test/application/models',
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
      expect(response.body.data).to.deep.equal({listPost: []});
    });
  });

  it('has a POST /graphql endpoint', () => {
    const data = {
      query: '{listPost{id}}'
    };
    return Needle.postAsync(uri + '/graphql', data, {json: true}).then(response => {
      expect(response.statusCode).to.equal(200);
      expect(response.body.data).to.deep.equal({listPost: []});
    });
  });

  it('provides errors in the "errors" property', () => {
    const data = {
      query: '{createPost(teststring:123,testint:"string")}'
    };
    return Needle.postAsync(uri + '/graphql', data, {json: true}).then(response => {
      expect(response.statusCode).to.equal(400);
      expect(response.body).to.have.property('errors');
      expect(response.body.errors).to.have.length(2);
      expect(response.body.errors[0]).to.contain('wrong type');
    });
  });

  it('can send GraphQL query using Lokka', () => {
    const client = new Lokka(uri + '/graphql');
    return client.send('{post:createPost(title:$title){id title}}', {title: 'Test'}).then(response => {
      expect(response).to.have.property('post');
      expect(response.post).to.have.property('id');
      expect(response.post).to.have.property('title', 'Test');
    });
  });
});
