'use strict';

const {clone} = require('lodash');
const fetch = require('node-fetch');

module.exports = {
  title: 'HTTP request',
  description: 'Perform HTTP request',

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
        enum: ['auto', 'json', 'xml', 'blob', 'text']
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
        oneOf: [{
          title: 'Raw input',
          type: 'string'
        }, {
          title: 'JSON object',
          type: 'object'
        }]
      }
    },
    required: ['url'],
    additionalProperties: false
  },

  defaults: {
    method: 'GET',
    headers: {},
    format: 'auto',
    cookies: {}
  },

  unary: async ({url, headers = {}, method = 'GET', body, format = 'auto', cookies = {}}) => {
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
      throw new Error(`Unable to connect to "${url}": ${err.message}`);
    });
  }
};
