/* eslint-env node, mocha */
"use strict";

var Promise = require('bluebird');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;

var Storage = require('../classes/Storage.js');

describe('Query', function() {
  var storage;
  var temporary = {};

  before(function() {
    storage = new Storage({
      modelsDir: 'test/models'
    });
  });

  after(function() {
  });

  it('fails on misformatted queries', function() {
    return new Promise(function() {
      let query = `{...}`;
      storage.query(query)
    }).then(() => {
      throw Error('should be rejected');
    }).catch((error) => {
      expect(error.message).to.match(/^Query error: /);
    });
  });
});
