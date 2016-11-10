/* eslint-env node, mocha */
'use strict';

const Crypto = require('crypto');

const _ = require('lodash');
const Promise = require('bluebird');
const Faker = require('faker');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const GoogleSearchMockup = require('./mockups/googlesearch');
const Storage = require('../classes/Storage.js');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('RestApi', () => {
  let storage;
  let temporary = {};
  let googleSearch;
  let searchResults = {};
  let requestCount = 0;

  const cx = Crypto.randomBytes(8).toString('base64');
  const key = Crypto.randomBytes(8).toString('base64');

  before(() => {
    storage = new Storage({
      modelsDir: 'test/models',
      databases: {
        internal: {
          engine: 'redis',
          host: 'localhost',
          port: 6379,
          prefix: '',
        },
        rethink: {
          engine: 'RethinkDB',
          host: 'localhost',
          port: 28015,
          name: 'test'
        },
        restapi: {
          engine: 'RestApi',
          parameters: {
            baseUri: 'http://localhost:8371',
            key: key,
            cx: cx
          }
        }
      }
    });
    googleSearch = new GoogleSearchMockup(key, cx);
    return googleSearch.startup();
  });

  after(() => {
    return googleSearch.shutdown();
  });

  it('can list results', () => {
    const keyword = 't';
    const query = `{
      results: listExternal(query:?) {
        id title link snippet
      }
    }`;
    return storage.query(query, [keyword]).then(result => {
      // The number of returned items from the mockup is 7 times
      // the character count of the search query.
      expect(result.results).to.have.length(7);
      for (let i = 0; i < result.results.length; ++i) {
        expect(result.results[i].title).equals(googleSearch.searchResults[keyword].items[i].title);
      }
      // Result can be fetched with a single request.
      expect(googleSearch.requestCount()).to.equal(1);
    });
  });

  it('can compose result of multiple pages', () => {
    const keyword = 'test';
    const query = `{
      results: listExternal(query:?) {
        id title link snippet
      }
    }`;
    return storage.query(query, [keyword]).then(result => {
      // Number of results should be 4 * 7.
      expect(result.results).to.have.length(28);
      for (let i = 0; i < result.results.length; ++i) {
        expect(result.results[i].title).equals(googleSearch.searchResults[keyword].items[i].title);
      }
      expect(googleSearch.requestCount()).to.equal(3);
    });
  });

  it('will not return more results than maxPages * itemsPerPage', () => {
    const keyword = 'lorem';
    const query = `{
      results: listExternal(query:?) {
        id title link snippet
      }
    }`;
    return storage.query(query, [keyword]).then(result => {
      // Total result count should be 5 * 7 = 35,
      // but maximum number is 3 * 10 = 30.
      expect(result.results).to.have.length(30);
      for (let i = 0; i < result.results.length; ++i) {
        expect(result.results[i].title).equals(googleSearch.searchResults[keyword].items[i].title);
      }
      expect(googleSearch.requestCount()).to.equal(3);
    });
  });
});
