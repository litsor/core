
const _ = require('lodash');
const Faker = require('faker');
const BlueGate = require('bluegate');

class GoogleSearchMockup {
  constructor(key, cx) {
    this.key = key;
    this.cx = cx;
    this.searchResults = {};
    this._requestCount = 0;
  }

  generateResults(query) {
    const totalResults = 7 * query.length;
    const results = {
      searchInformation: {
        totalResults
      },
      items: []
    };
    for (var i = 0; i < totalResults; ++i) {
      const domain = Faker.internet.domainName();
      results.items.push({
        title: Faker.lorem.sentence(),
        link: 'http://' + domain + '/' + Faker.internet.domainWord(),
        displayLink: domain,
        snippet: Faker.lorem.text()
      });
    }
    this.searchResults[query] = results;
  };

  startup() {
    var self = this;
    this.api = new BlueGate({log: false});
    this.api.error(function(error) { console.error(this.error); });
    this.api.authentication(function() {
      const key = this.getQuery('key', 'string');
      const cx = this.getQuery('cx', 'string');
      if (self.key !== key || self.cx !== cx) {
        throw new Error('Invalid key or cx');
      }
    });
    this.api.process('GET /customsearch/v1', function() {
      ++self._requestCount;
      const query = this.getQuery('q', 'string');
      const offset = this.getQuery('start', 'int', 1);
      if (typeof self.searchResults[query] === 'undefined') {
        self.generateResults(query);
      }
      const output = _.cloneDeep(self.searchResults[query]);
      output.items = output.items.slice(offset - 1, offset + 9);
      return output;
    });
    return this.api.listen(8371);
  }

  shutdown() {
    return this.api.close();
  }

  requestCount() {
    const value = this._requestCount;
    this._requestCount = 0;
    return value;
  }
}

module.exports = GoogleSearchMockup;
