/* eslint-env node, mocha */
'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const fetch = require('node-fetch');
const Lokka = require('lokka-transport-http').Transport;

const Container = require('../classes/container');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('Application', () => {
  let container;
  const uri = 'http://localhost:10023';

  before(async () => {
    container = new Container();
    await container.startup();

    const config = await container.get('Config');
    config.set('/', {
      port: 10023,
      authentication: {
        admins: {
          admin: 'pbkdf2$sha256$7ps$w$ROMbPRTvX0w=$cTFu+GcA562wCATxUcNlR0cbKx7nG6fBU0IsS5wWusI='
        },
        userFields: ['id', 'admin'],
        usernameField: 'mail'
      },
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
    await container.get('Application');
  });

  after(async () => {
    await container.shutdown();
  });

  it('has a GET /graphql endpoint', () => {
    const query = '{listPost{id}}';
    return fetch(uri + '/graphql?q=' + encodeURIComponent(query)).then(response => {
      expect(response.status).to.equal(200);
      return response.json();
    }).then(body => {
      expect(body.data).to.deep.equal({listPost: []});
    });
  });

  it('has a POST /graphql endpoint', () => {
    const data = {
      query: '{listPost{id}}'
    };
    return fetch(uri + '/graphql', {method: 'POST', body: JSON.stringify(data), headers: {'Content-Type': 'application/json'}}).then(response => {
      expect(response.status).to.equal(200);
      return response.json();
    }).then(body => {
      expect(body.data).to.deep.equal({listPost: []});
    });
  });

  it('provides errors in the "errors" property', () => {
    const data = {
      query: '{createPost(teststring:123,testint:"string")}'
    };
    return fetch(uri + '/graphql', {method: 'POST', body: JSON.stringify(data), headers: {'Content-Type': 'application/json'}}).then(response => {
      expect(response.status).to.equal(400);
      return response.json();
    }).then(body => {
      expect(body).to.have.property('errors');
      expect(body.errors).to.have.length(2);
      expect(body.errors[0]).to.contain('wrong type');
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

  it('has a POST /script endpoint', () => {
    const data = {
      definition: {
        name: 'Testscript',
        steps: [{
          static: 'test'
        }]
      }
    };
    const options = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + (new Buffer('admin:secret').toString('base64'))
      }
    };
    return fetch(uri + '/script', options).then(response => {
      expect(response.status).to.equal(200);
      return response.json();
    }).then(body => {
      expect(body.data).to.deep.equal('test');
    });
  });
});
