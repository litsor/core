'use strict';

const {parse} = require('url');
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

  requires: ['Statistics', 'Immutable'],

  unary: async (input, {Statistics, Immutable}) => {
    const {url, headers = {}, method = 'GET', body, format = 'auto', cookies = {}} = input.toJS();
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

    const host = parse(url).host;
    if (host === null) {
      throw new Error('Missing hostname in URL');
    }

    let durationStatistic = Statistics.get('request_duration_seconds');
    if (!durationStatistic) {
      durationStatistic = await Statistics.add('Histogram', 'request_duration_seconds', 'request duration in seconds');
    }
    let statusStatistic = Statistics.get('request_status');
    if (!statusStatistic) {
      statusStatistic = await Statistics.add('Counter', 'requests', 'number of requests by host and response status');
    }
    const start = new Date();
    const recordStats = status => {
      if (status >= 200 && status < 500) {
        durationStatistic.add((new Date() - start) / 1e3, {host});
      }
      // Record status as one of 2xx, 3xx, 400, 401, 403, 429, 4xx, 5xx or connect_error.
      const statusCategory = [400, 401, 403, 429].indexOf(status) < 0 ? String(status).match(/^[\d]{3}$/) ? String(status)[0] + 'xx' : 'connect_error' : String(status);
      statusStatistic.count({host, status: statusCategory});
    };

    return fetch(url, {method, headers, body}).then(_response => {
      response = _response;
      recordStats(response.status);
      if (response.status >= 300) {
        throw new Error('Retrieved error code from remote server: ' + response.status);
      }
      if (format === 'json' || (format === 'auto' && response.headers.get('content-type').match(/^application\/json/))) {
        return Immutable.fromJS(response.json());
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
      return Immutable.fromJS({
        body,
        headers: response.headers.raw(),
        cookies: getCookies(response, cookies)
      });
    }).catch(err => {
      recordStats(0);
      throw new Error(`Unable to connect to "${url}": ${err.message}`);
    });
  }
};
