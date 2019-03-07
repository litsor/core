'use strict';

const Faker = require('faker');
const BlueGate = require('bluegate');

/**
 * Website mockup.
 *
 * This mockup represents a website for testing crawling possibilities.
 * It has different representations of the same list. The list contains people
 * with name and age.
 *
 * The following pages are available:
 *
 * /list-more
 *   List with a "load more" button to get following results.
 * /list-pages
 *   List with page numbering
 * /item/[0-9]
 *   Item detail page.
 * /table/[0-9]
 *   Item detail page, table view.
 */
class Website {
  constructor() {
    this.people = [];
    for (let i = 0; i < 25; ++i) {
      this.people.push({
        name: Faker.name.firstName(),
        age: ~~((Math.random() * 30) + 20)
      });
    }
    this._requestCount = 0;
  }

  html(contents) {
    return `<html><body>${contents}</body></html>`;
  }

  startup() {
    this.api = new BlueGate({log: false});
    this.api.error(request => {
      console.error(request.error);
    });
    this.api.initialize(() => {
      ++this._requestCount;
    });

    this.api.process('GET /list-more', () => {
      const items = this.people.slice(0, 10).map((item, index) => {
        return `<div class="item"><a href="/item/${index}">${item.name}</a></div>`;
      });
      return this.html(`<ul class="items">${items}</ul><a href="/list-more/1" class="list-more">List more</a>`);
    });
    this.api.process('GET /list-more/<page:int>', page => {
      const items = this.people.slice(page * 10, (page * 10) + 10).map((item, index) => {
        return `<div class="item"><a href="/item/${index}">${item.name}</a></div>`;
      });
      if (this.people.length > (page * 10) + 10) {
        const nextPage = page + 1;
        return this.html(`<ul class="items">${items}</ul><a href="/list-more/${nextPage}" class="list-more">List more</a>`);
      }
      return this.html(`<ul class="items">${items}</ul><a href="/list-more/1" class="list-more">List more</a>`);
    });

    this.api.process('GET /list-pages', () => {
      const items = this.people.slice(0, 10).map((item, index) => {
        return `<div class="item"><a href="/table/${index}">${item.name}</a></div>`;
      });
      let pages = [];
      for (let i = 1; i <= Math.ceil(this.people.length / 10); ++i) {
        pages.push(`<li><a href="/list-pages/${i}">${i}</a></li>`);
      }
      pages = '<ul class="pages">' + pages.join() + '</ul>';
      return this.html(`<ul class="items">${items}</ul>${pages}`);
    });
    this.api.process('GET /list-pages/<page:unsigned>', page => {
      const items = this.people.slice(page * 10, (page * 10) + 10).map((item, index) => {
        return `<div class="item"><a href="/table/${index}">${item.name}</a></div>`;
      });
      let pages = [];
      for (let i = 1; i <= Math.ceil(this.people.length / 10); ++i) {
        pages.push(`<li><a href="/list-pages/${i}">${i}</a></li>`);
      }
      pages = '<ul class="pages">' + pages.join() + '</ul>';
      return this.html(`<ul class="items">${items}</ul>${pages}`);
    });

    this.api.process('GET /item/<id:unsigned>', id => {
      const person = this.people[id];
      return this.html(`<div class="name">${person.name}</div><div class="age">${person.age}</div>`);
    });

    this.api.process('GET /table/<id:unsigned>', id => {
      const person = this.people[id];
      return this.html(`<table>
        <tr><td>Name</td><td>${person.name}</td></tr>
        <tr><td>Age</td><td>${person.age}</td></tr>
      </table>`);
    });

    this.api.process('GET /feed.json', () => {
      return this.people;
    });

    this.api.process('GET /feed.xml', request => {
      request.mime = 'text/xml';
      const items = this.people.map(item => {
        return `<item>
          <name>${item.name}</name>
          <age>${item.age}</age>
        </item>`;
      });
      return '<root>' + items.join('') + '</root>';
    });

    this.api.process('GET /cookie/a', request => {
      request.setCookie('sessId', 'abc_ABC-342');
      return {};
    });

    this.api.process('GET /cookie/b', request => {
      const foundCookie = request.getCookie('sessId', 'string') === 'abc_ABC-342';
      return {foundCookie};
    });

    this.api.process('POST /echo', request => {
      request.mime = request.headers['content-type'];
      return request.body;
    });

    this.api.process('GET /headers', request => {
      return request.headers;
    });

    this.api.process('GET /unknown-page', request => {
      request.status = 404;
      return {};
    });

    return this.api.listen(8372);
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

module.exports = Website;
