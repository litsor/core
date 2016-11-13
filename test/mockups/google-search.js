
const _ = require('lodash');
const Faker = require('faker');
const BlueGate = require('bluegate');

class GoogleSearch {
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
    for (let i = 0; i < totalResults; ++i) {
      const domain = Faker.internet.domainName();
      results.items.push({
        title: Faker.lorem.sentence(),
        link: 'http://' + domain + '/' + Faker.internet.domainWord(),
        displayLink: domain,
        snippet: Faker.lorem.text()
      });
    }
    this.searchResults[query] = results;
  }

  startup() {
    this.api = new BlueGate({log: false});
    this.api.error(request => {
      console.error(request.error);
    });
    this.api.authentication(request => {
      const key = request.getQuery('key', 'string');
      const cx = request.getQuery('cx', 'string');
      if (this.key !== key || this.cx !== cx) {
        throw new Error('Invalid key or cx');
      }
    });
    this.api.process('GET /customsearch/v1', request => {
      ++this._requestCount;
      const query = request.getQuery('q', 'string');
      const offset = request.getQuery('start', 'int', 1);
      if (typeof this.searchResults[query] === 'undefined') {
        this.generateResults(query);
      }
      const output = _.cloneDeep(this.searchResults[query]);
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

module.exports = GoogleSearch;
