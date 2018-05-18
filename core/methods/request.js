'use strict';

const {clone} = require('lodash');
const fetch = require('node-fetch');
const {expect} = require('chai');
const websiteMockup = require('../test/mockups/website');

module.exports = {
  title: 'HTTP request',
  description: 'Perform HTTP request',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      url: {
        title: 'Request URL',
        type: 'string'
      },
      method: {
        title: 'HTTP method',
        type: 'string',
        enum: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH']
      },
      headers: {
        title: 'Headers',
        type: 'object',
        additionalProperties: {
          title: 'Header value',
          type: 'string'
        }
      },
      format: {
        title: 'Response format',
        type: 'string',
        enum: ['auto', 'json', 'xml', 'blob']
      },
      cookies: {
        title: 'Request cookies',
        type: 'object',
        additionalProperties: {
          title: 'Cookie value',
          type: 'string'
        }
      },
      body: {
        title: 'Request body',
        type: 'string'
      }
    },
    required: ['url'],
    additionalProperties: false
  },

  outputSchema: () => {
    return {};
  },

  defaults: {
    method: 'GET',
    headers: {},
    format: 'auto',
    cookies: {}
  },

  requires: [],

  mockups: {
    Fetch: true
  },

  async startupTest() {
    this.websiteMockup = new websiteMockup();
    await this.websiteMockup.startup();
  },

  async shutdownTest() {
    await this.websiteMockup.shutdown();
  },

  tests: [{
    title: 'can execute request',
    input: {
      url: 'http://localhost:8372/list-pages'
    },
    output: (output) => {
      expect(output).to.have.property('headers');
      expect(output).to.have.property('body');
      expect(output.body).to.be.a('string');
      expect(output.headers).to.have.property('content-type');
      return true;
    }
  }, {
    title: 'will parse JSON output on request',
    input: {
      url: 'http://localhost:8372/feed.json'
    },
    output: (output) => {
      expect(output.body instanceof Array).to.equal(true);
      return true;
    }
  }, {
    title: 'will return cookies on request',
    input: {
      url: 'http://localhost:8372/cookie/a'
    },
    output: (output) => {
      expect(output.cookies).to.have.property('sessId');
      return true;
    }
  }, {
    title: 'can provide cookies for request',
    input: {
      url: 'http://localhost:8372/cookie/b',
      cookies: {
        testcookie: '123'
      }
    },
    output: (output) => {
      expect(output.cookies).to.have.property('testcookie');
      return true;
    }
  }, {
    title: 'can post request body',
    input: {
      method: 'POST',
      url: 'http://localhost:8372/echo',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      },
      body: 'Lorem ipsum'
    },
    output: (output) => {
      expect(output.headers['content-type'][0]).to.equal('text/plain; charset=utf-8');
      expect(output.body).to.equal('Lorem ipsum');
      return true;
    }
  }],

  execute: async ({url, headers, method, body, format, cookies}) => {
    const getCookies = (res, initialCookies) => {
      const cookies = clone(initialCookies || {});
      // @todo: Does not work for multiple cookies.
      const header = res.headers.get('set-cookie');
      if (header) {
        const match = header.match(/^([^=]+)=([^;]*)/);
        if (match) {
          const name = match[1];
          const value = match[2];
          if (value) {
            cookies[name] = value;
          } else if (typeof cookies[name] !== 'undefined') {
            delete cookies[name];
          }
        }
      }
      return cookies;
    };

    const getCookieHeader = cookies => {
      const output = [];
      Object.keys(cookies).forEach(name => {
        output.push(name + '=' + cookies[name]);
      });
      return output.join('; ');
    };

    let response;
    if (Object.keys(cookies).length > 0) {
      headers.Cookie = getCookieHeader(cookies);
    }
    return fetch(url, {method, headers, body}).then(_response => {
      response = _response;
      if (response.status >= 300) {
        throw new Error('Retrieved error code from remote server: ' + response.status);
      }
      if (format === 'json' || (format === 'auto' && response.headers.get('content-type').match(/^application\/json/))) {
        return response.json();
      }
      if (format === 'xml' || (format === 'auto' && response.headers.get('content-type').match(/^text\/xml/))) {
        // @todo: Convert to XML.
      }
      if (format === 'blob') {
        return response.buffer().then(buffer => {
          return buffer.toString('base64');
        });
      }
      return response.text();
    }).then(body => {
      return {
        body,
        headers: response.headers.raw(),
        cookies: getCookies(response, cookies)
      };
    }).catch(err => {
      console.log(err);
      throw new Error(`Unable to connect to "${url}"`);
    });
  }
};
