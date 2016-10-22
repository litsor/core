/* eslint-env node, mocha */
'use strict';

const Promise = require('bluebird');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Needle = Promise.promisifyAll(require('needle'));

const Application = require('../classes/Application.js');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('Authentication', () => {
  let app;

  const uri = 'http://localhost:10023';

  before(() => {
    app = new Application({
      port: 10023,
      authentication: {
        admins: {
          admin: 'pbkdf2$sha256$7ps$w$ROMbPRTvX0w=$cTFu+GcA562wCATxUcNlR0cbKx7nG6fBU0IsS5wWusI='
        },
        userFields: ['id', 'admin'],
        usernameField: 'mail'
      },
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
            host: 'rethink',
            port: 20015,
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
  
  it('cannot create User without authentication', () => {
    const query = '{createUser(name:"Alice",mail:"alice@example.com",password:""){id}}';
    return Needle.getAsync(uri + '/graphql?q=' + encodeURIComponent(query)).then(response => {
      expect(response.statusCode).to.equal(403);
    });
  });
  
  it('can create User as admin', () => {
    const options = {
      headers: {
        Authentication: 'Basic ' + (new Buffer('admin:secret').toString('base64'))
      }
    };
    const query = '{createUser(name:"Alice",mail:"alice@example.com",password:"Welcome!"){id}}';
    return Needle.getAsync(uri + '/graphql?q=' + encodeURIComponent(query), options).then(response => {
      expect(response.statusCode).to.equal(200);
    });
  });
  
  it('will not provide an access token with invalid password', () => {
    const data = {
      grant_type: 'password',
      username: 'alice@example.com',
      password: 'invalid'
    };
    return Needle.postAsync(uri + '/token', data).then(response => {
      expect(response.statusCode).to.equal(401);
    });
  });
  
  it('will provide an access token with valid password', () => {
    const data = {
      grant_type: 'password',
      username: 'alice@example.com',
      password: 'Welcome!'
    };
    return Needle.postAsync(uri + '/token', data).then(response => {
      expect(response.statusCode).to.equal(200);
    });
  });
});
