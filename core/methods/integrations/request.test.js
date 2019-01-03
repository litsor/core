'use strict';

let expect;
let WebsiteMockup;
let websiteMockup;

module.exports = {
  mockups: {
    Fetch: true,
    Statistics: {
      async add() {
        return {
          add() {},
          count() {}
        };
      },
      get() {
        return {
          add() {},
          count() {}
        };
      }
    }
  },

  async startupTest() {
    expect = require('chai').expect;
    WebsiteMockup = require('../../test/mockups/website');
    websiteMockup = new WebsiteMockup();
    await websiteMockup.startup();
  },

  async shutdownTest() {
    await websiteMockup.shutdown();
  },

  tests: [{
    can: 'execute request',
    input: {
      url: 'http://localhost:8372/list-pages'
    },
    output: output => {
      expect(output).to.have.property('headers');
      expect(output).to.have.property('body');
      expect(output.body).to.be.a('string');
      expect(output.headers).to.have.property('content-type');
      return true;
    }
  }, {
    can: 'parse JSON output on request',
    input: {
      url: 'http://localhost:8372/feed.json'
    },
    output: output => {
      expect(Array.isArray(output.body)).to.equal(true);
      return true;
    }
  }, {
    can: 'return cookies on request',
    input: {
      url: 'http://localhost:8372/cookie/a'
    },
    output: output => {
      expect(output.cookies).to.have.property('sessId');
      return true;
    }
  }, {
    can: 'provide cookies for request',
    input: {
      url: 'http://localhost:8372/cookie/b',
      cookies: {
        testcookie: '123'
      }
    },
    output: output => {
      expect(output.cookies).to.have.property('testcookie');
      return true;
    }
  }, {
    can: 'post request body',
    input: {
      method: 'POST',
      url: 'http://localhost:8372/echo',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      },
      body: 'Lorem ipsum'
    },
    output: output => {
      expect(output.headers['content-type'][0]).to.equal('text/plain; charset=utf-8');
      expect(output.body).to.equal('Lorem ipsum');
      return true;
    }
  }]
};
