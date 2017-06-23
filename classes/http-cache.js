'use strict';

const Crypto = require('crypto');
const Path = require('path');
const Url = require('url');

const _Fs = require('fs');
const _ = require('lodash');
const Bluebird = require('bluebird');
const fetch = require('node-fetch');
const HttpError = require('http-errors');

const Fs = Bluebird.promisifyAll(_Fs);

class HttpCache {
  constructor(app, storage, config) {
    this.app = app;
    this.storage = storage;
    this.config = _.defaults(config, {
      directory: '/tmp',
      keepLast: 10,
      hosts: {
        // 'www.example.com': {
        //   // Cache lifetime in seconds.
        //   ttl: 60,
        //   // Cache POST and other non-GET requests.
        //   post: true
        // }
      }
    });

    this.lastRequests = [];

    app.authorisation('GET /http-requests', admin => {
      if (!admin) {
        throw new HttpError(403, 'Permission denied');
      }
    });

    app.process('GET /http-requests', () => {
      return this.lastRequests;
    });
  }

  getTtl(url, options) {
    const method = (options || {}).method || 'GET';
    const hostname = Url.parse(url).hostname;
    const config = this.config.hosts[hostname];
    if (typeof config === 'undefined') {
      // Caching is not enabled for this host.
      return 0;
    }
    if (!config.post && method !== 'GET') {
      // Non-GET request and caching disabled for non-GET.
      return 0;
    }
    return config.ttl;
  }

  fetch(url, options) {
    const ttl = this.getTtl(url);
    if (!ttl) {
      // Not cacheable.
      return fetch(url, options);
    }
    return this.readCache(url, options).then(cache => {
      if (typeof cache !== 'undefined') {
        return this.responseFromCache(url, cache);
      }
      return this.fetchAndWriteToCache(url, options);
    });
  }

  responseFromCache(url, cache) {
    const head = cache.slice(0, 1024).toString().split('\r\n');
    if (head.length < 2) {
      throw new Error('Corrupt cache file');
    }
    const [, status, statusText] = head[0].match(/^HTTP ([\d]+) (.+)/);
    const headers = {};
    let headerLength = Buffer.byteLength(head[0]) + 2;
    for (let i = 1; i < head.length; ++i) {
      headerLength += Buffer.byteLength(head[i]) + 2;
      if (head[i] === '') {
        break;
      }
      const [, name, value] = head[i].match(/^([^:]+): (.*)$/);
      headers[name] = headers[name] || [];
      headers[name].push(value);
    }
    const body = cache.slice(headerLength);
    return new fetch.Response(body, {
      url,
      headers,
      status: parseInt(status, 10),
      statusText
    });
  }

  fetchAndWriteToCache(url, options) {
    let response;
    let headers;
    let body;
    const raw = [];
    const start = new Date();
    let time;
    return fetch(url, options).then(_response => {
      response = _response;
      raw.push(Buffer.from('HTTP ' + response.status + ' ' + response.statusText + '\r\n'));
      headers = response.headers.raw();
      Object.keys(headers).forEach(key => {
        Object.keys(headers[key]).forEach(index => {
          const value = headers[key][index];
          raw.push(Buffer.from(key + ': ' + value + '\r\n'));
        });
      });
      raw.push(Buffer.from('\r\n'));
      return response.buffer();
    }).then(_body => {
      body = _body;
      time = new Date() - start;
      raw.push(body);
      if (response.status < 400) {
        return this.writeCache(url, options, Buffer.concat(raw));
      }
    }).then(() => {
      this.lastRequests.unshift({
        url,
        headers,
        status: response.status,
        statusText: response.statusText,
        body: body.slice(0, 10240).toString('base64'),
        time
      });
      this.lastRequests = this.lastRequests.slice(0, this.config.keepLast);
      return new fetch.Response(body, {
        url,
        headers,
        status: response.status,
        statusText: response.statusText
      });
    });
  }

  getCacheFilename(url, options) {
    const fullOptions = {
      method: (options || {}).method || 'GET',
      body: (options || {}).body || '',
      headers: (options || {}).headers || {}
    };
    const hashBase = url + fullOptions.method + JSON.stringify(fullOptions.headers) + fullOptions.body.toString();
    const hash = Crypto.createHash('md5').update(hashBase).digest('hex');
    return Path.resolve(this.config.directory, 'http-cache-' + hash);
  }

  writeCache(url, options, raw) {
    const ttl = this.getTtl(url);
    if (ttl) {
      const filename = this.getCacheFilename(url, options);
      return Fs.writeFileAsync(filename, raw);
    }
  }

  readCache(url, options) {
    const ttl = this.getTtl(url);
    if (!ttl) {
      // Caching is not enabled. Skip file lookup.
      return;
    }
    const filename = this.getCacheFilename(url, options);
    return Fs.statAsync(filename).then(stats => {
      const age = (new Date() - stats.mtime) / 1e3;
      if (stats.isFile() && age < ttl) {
        return Fs.readFileAsync(filename);
      }
    }).catch(() => {
      // Ignore "ENOENT: no such file or directory" error.
    });
  }

  flushAll() {
    return Fs.readdirAsync(this.config.directory).then(files => {
      return files.filter(name => name.match(/^http-cache-.{32}$/));
    }).each(filename => {
      return Fs.unlinkAsync(Path.resolve(this.config.directory, filename));
    });
  }
}

module.exports = HttpCache;
