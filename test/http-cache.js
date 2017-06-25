/* eslint-env node, mocha */
'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Bluebird = require('bluebird');
const fetch = require('node-fetch');

const Container = require('../classes/container');

const GoogleSearchMockup = require('./mockups/google-search');
const WebsiteMockup = require('./mockups/website');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('Http Cache', () => {
  let container;
  let httpCache;
  let googleSearch;
  let website;

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
      },
      httpCache: {
        directory: '/tmp',
        hosts: {
          localhost: {
            // Cache lifetime in seconds.
            ttl: 2,
            // Cache POST and other non-GET requests.
            post: true
          }
        }
      }
    });
    const app = await container.get('Application');
    httpCache = app.instances.httpCache;
    googleSearch = new GoogleSearchMockup('', '');
    website = new WebsiteMockup();
    return Promise.all([
      googleSearch.startup(),
      website.startup()
    ]);
  });

  after(async () => {
    await container.shutdown();
    await Promise.all([
      googleSearch.shutdown(),
      website.shutdown()
    ]);
  });

  beforeEach(() => {
    // Reset the counter.
    website.requestCount();
    return httpCache.flushAll();
  });

  it('can do a GET request with HttpCache', () => {
    return httpCache.fetch('http://localhost:8372/list-more').then(response => {
      expect(response.status).to.equal(200);
      return response.text();
    }).then(body => {
      expect(body).to.be.a('string');
      expect(body).to.contain('<html>');
    });
  });

  it('will pass headers', () => {
    const options = {
      headers: {
        'X-Foo': 'Bar'
      }
    };
    return httpCache.fetch('http://localhost:8372/headers', options).then(response => {
      expect(response.status).to.equal(200);
      return response.json();
    }).then(body => {
      expect(body).to.be.an('object');
      expect(body).to.have.property('x-foo', 'Bar');
    });
  });

  it('will pass body', () => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: 'test'
    };
    return httpCache.fetch('http://localhost:8372/echo', options).then(response => {
      expect(response.status).to.equal(200);
      return response.text();
    }).then(body => {
      expect(body).to.be.a('string');
      expect(body).to.equal('test');
    });
  });

  it('will cache request', () => {
    return httpCache.fetch('http://localhost:8372/list-more').then(response => {
      expect(response.status).to.equal(200);
      expect(website.requestCount()).to.equal(1);
      return Bluebird.delay(50);
    }).then(() => {
      return httpCache.fetch('http://localhost:8372/list-more');
    }).then(response => {
      expect(response.status).to.equal(200);
      expect(website.requestCount()).to.equal(0);
    });
  });

  it('will contain headers in cached request', () => {
    return httpCache.fetch('http://localhost:8372/list-more').then(() => {
      return Bluebird.delay(50);
    }).then(() => {
      return httpCache.fetch('http://localhost:8372/list-more');
    }).then(response => {
      expect(response.headers.get('Content-Type')).to.equal('text/html; charset=utf-8');
    });
  });

  it('will contain body in cached request', () => {
    const options = {
      headers: {
        'X-Foo': 'Bar'
      }
    };
    return httpCache.fetch('http://localhost:8372/headers', options).then(() => {
      return Bluebird.delay(50);
    }).then(() => {
      return httpCache.fetch('http://localhost:8372/headers', options);
    }).then(response => response.json()).then(body => {
      expect(body).to.be.an('object');
      expect(body).to.have.property('x-foo', 'Bar');
    });
  });

  it('has a GET /http-requests endpoint', () => {
    const options = {
      headers: {
        Authorization: 'Basic ' + (new Buffer('admin:secret').toString('base64'))
      }
    };
    return fetch('http://localhost:10023/http-requests', options).then(response => {
      expect(response.status).to.equal(200);
      return response.json();
    }).then(body => {
      expect(body).to.be.an('Array');
      expect(body[0]).to.have.property('url');
      expect(body[0]).to.have.property('headers');
      expect(body[0]).to.have.property('body');
      expect(body[0]).to.have.property('status');
      expect(body[0]).to.have.property('statusText');
      expect(body[0]).to.have.property('time');
    });
  });
});
