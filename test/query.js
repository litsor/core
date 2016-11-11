/* eslint-env node, mocha */
'use strict';

const Promise = require('bluebird');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const Storage = require('../classes/Storage.js');
const Ids = require('../classes/Ids');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('Query', () => {
  let storage;
  let temporary = {};

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
          engine: 'RestApi'
        }
      }
    });
  });

  after(() => {
  });

  it('fails on misformatted queries', () => {
    return new Promise(() => {
      const query = `{...}`;
      return storage.query(query)
    }).then(() => {
      throw new Error('should be rejected');
    }).catch((error) => {
      expect(error.message).to.match(/^Query error: /);
    }).done();
  });

  it('fails on unknown operations', () => {
    return Promise.resolve().then(() => {
      const query = `{writePost}`;
      return storage.query(query);
    }).then(() => {
      throw new Error('should be rejected');
    }).catch((error) => {
      expect(error.message).to.match(/^Query error: /);
    }).done();
  });

  it('can create data with strings', () => {
    const query = `{
      createPost(teststring:"This is a test") {
        id
      }
    }`;
    return storage.query(query).then(result => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });

  it('can get data with strings', () => {
    const query = `{
      readPost(id:?) {
        teststring
      }
    }`;
    const id = temporary.id;
    return storage.query(query, [id]).then(result => {
      expect(result.readPost).to.have.property('teststring', 'This is a test');
    });
  });

  it('can create data with integers', () => {
    const query = `{
      createPost(testint:123) {
        id
      }
    }`;
    return storage.query(query).then(result => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });

  it('can get data with integers', () => {
    const query = `{
      readPost(id:?) {
        testint
      }
    }`;
    const id = temporary.id;
    return storage.query(query, [id]).then(result => {
      expect(result.readPost).to.have.property('testint', 123);
    });
  });

  it('can create data with floats', () => {
    const query = `{
      createPost(testfloat:1.23) {
        id
      }
    }`;
    return storage.query(query).then(result => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });

  it('can get data with floats', () => {
    const query = `{
      readPost(id:?) {
        testfloat
      }
    }`;
    const id = temporary.id;
    return storage.query(query, [id]).then(result => {
      expect(result.readPost).to.have.property('testfloat', 1.23);
    });
  });

  it('can create data with objects', () => {
    let query = `{
      createPost(testobject:{foo:"bar"}) {
        id
      }
    }`;
    return storage.query(query).then(result => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });

  it('can get data with objects', () => {
    let query = `{
      readPost(id:?) {
        testobject
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then(result => {
      expect(result.readPost).to.have.property('testobject');
      expect(result.readPost.testobject).to.deep.equal({foo: 'bar'});
    });
  });

  it('can create data with lists', () => {
    let query = `{
      createPost(testlist:[{},{}]) {
        id
      }
    }`;
    return storage.query(query).then(result => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });

  it('can get data with lists', () => {
    let query = `{
      readPost(id:?) {
        testlist
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then(result => {
      expect(result.readPost).to.have.property('testlist');
      expect(result.readPost.testlist).to.deep.equal([{},{}]);
    });
  });

  it('can create data with booleans', () => {
    let query = `{
      createPost(testboolean:true) {
        id
      }
    }`;
    return storage.query(query).then(result => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });

  it('can get data with booleans', () => {
    let query = `{
      readPost(id:?) {
        testboolean
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then(result => {
      expect(result.readPost).to.have.property('testboolean');
      expect(result.readPost.testboolean).to.equal(true);
    });
  });

  it('allows us to omit "read" for read operations', () => {
    let query = `{
      Post(id:?) {
        id
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then(result => {
      expect(result).to.have.property('Post');
      expect(result.Post).to.have.property('id');
    });
  });

  it('allows using aliases', () => {
    let query = `{
      p: Post(id:?) {
        id
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then(result => {
      expect(result).to.have.property('p');
      expect(result.p).to.have.property('id');
    });
  });

  it('can create data with empty objects', () => {
    let query = `{
      createPost(testobject:{}) {
        id
      }
    }`;
    return storage.query(query).then(result => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });

  it('can get data with empty objects', () => {
    let query = `{
      readPost(id:?) {
        testobject
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then(result => {
      expect(result.readPost).to.have.property('testobject');
      expect(result.readPost.testobject).to.deep.equal({});
    });
  });

  it('can unset value by updating with undefined', () => {
    let query = `{
      updatePost(id:?,testobject:undefined) {
        testobject
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then(result => {
      expect(result.updatePost).to.have.property('testobject', null);
      // Also check read aftwerwards.
      query = '{Post(id:?){testobject}}';
      return storage.query(query, [id]);
    }).then(result => {
      expect(result.Post).to.have.property('testobject', null);
    });
  });

  it('will reject deleting required fields in update', () => {
    let query = '{story:createStory(title:"testtile",body:"testbody"){id}}';
    return storage.query(query).then(result => {
      let query = `{
        updateStory(id:?,title:undefined) {
          id title body
        }
      }`;
      let id = result.story.id;
      return storage.query(query, [id]);
    }).then(() => {
      throw new Error('should be rejected');
    }).catch((error) => {
      expect(error.message).to.match(/^Query error: /);
    }).done();
  });

  it('will fill nulls in fields without a value', () => {
    let query = `{
      readPost(id:?) {
        title
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then(result => {
      expect(result.readPost).to.have.property('title');
      expect(result.readPost.title).to.equal(null);
    });
  });

  it('will reject invalid data in create', () => {
    return Promise.resolve().then(() => {
      let query = '{story:createStory(title:234){id}}';
      return storage.query(query);
    }).then(() => {
      throw new Error('should be rejected');
    }).catch((error) => {
      expect(error.message).to.match(/^Query error: /);
    }).done();
  });

  it('will reject invalid data in read', () => {
    return Promise.resolve().then(() => {
      let query = '{story:readStory(id:{}){id}}';
      return storage.query(query);
    }).then(() => {
      throw new Error('should be rejected');
    }).catch((error) => {
      expect(error.message).to.match(/^Query error: /);
    }).done();
  });

  it('will reject invalid data in update', () => {
    let query = '{story:createStory(title:"Test",body:"Lorem ipsum"){id}}';
    return storage.query(query).then(result => {
      let query = `{
        updateStory(id:?,title:123) {
          id title body
        }
      }`;
      let id = result.story.id;
      return storage.query(query, [id]);
    }).then(() => {
      throw new Error('should be rejected');
    }).catch((error) => {
      expect(error.message).to.match(/^Query error: /);
    }).done();
  });

  it('will reject invalid data in delete', () => {
    return Promise.resolve().then(() => {
      let query = '{story:deleteStory(id:{}){id}}';
      return storage.query(query);
    }).then(() => {
      throw new Error('should be rejected');
    }).catch((error) => {
      expect(error.message).to.match(/^Query error: /);
    }).done();
  });

  it('can handle UTF-8 data in query', () => {
    // \u00A7 is the paragraph sign, from the Latin-1 supplement.
    let query = '{story:createStory(title:"Test",body:"\u00A7"){id body}}';
    return storage.query(query).then(result => {
      expect(result.story.body).to.equal('\xa7');
      let query = `{
        story:Story(id:?) { body }
      }`;
      let id = result.story.id;
      return storage.query(query, [id]);
    }).then(result => {
      expect(result.story.body).to.equal('\xa7');
    }).done();
  });

  it('can handle unicode sequences in query', () => {
    // \u00A7 is the paragraph sign, from the Latin-1 supplement.
    let query = '{story:createStory(title:"Test",body:"\\u00A7"){id body}}';
    return storage.query(query).then(result => {
      expect(result.story.body).to.equal('\xa7');
      let query = `{
        story:Story(id:?) { body }
      }`;
      let id = result.story.id;
      return storage.query(query, [id]);
    }).then(result => {
      expect(result.story.body).to.equal('\xa7');
    }).done();
  });

  it('can handle UTF-8 data in parameters', () => {
    // \u00A7 is the paragraph sign, from the Latin-1 supplement.
    let query = '{story:createStory(title:"Test",body:?){id body}}';
    let args = ['\u00A7'];
    return storage.query(query, args).then(result => {
      expect(result.story.body).to.equal('\xa7');
      let query = `{
        story:Story(id:?) { body }
      }`;
      let id = result.story.id;
      return storage.query(query, [id]);
    }).then(result => {
      expect(result.story.body).to.equal('\xa7');
    }).done();
  });

  it('can handle question marks in parameters', () => {
    let query = '{story:createStory(title:?,body:?){id title body}}';
    let args = ['???', 'Hello world?'];
    return storage.query(query, args).then(result => {
      expect(result.story.title).to.equal('???');
      expect(result.story.body).to.equal('Hello world?');
      let query = `{
        story:Story(id:?) { title body }
      }`;
      let id = result.story.id;
      return storage.query(query, [id]);
    }).then(result => {
      expect(result.story.title).to.equal('???');
      expect(result.story.body).to.equal('Hello world?');
    }).done();
  });

  it('will query when providing too few arguments', () => {
    let query = '{story:createStory(title:?,body:?){id}}';
    return Promise.resolve().then(result => {
      return storage.query(query, ['test']);
    }).then(() => {
      throw new Error('should be rejected');
    }).catch((error) => {
      expect(error.message).to.match(/^Query error: /);
    }).done();
  });

  /**
   * @doc
   * ## Dry run
   * Queries can be prepended by the ``dry`` keyword. This will
   * validate the query but will not make any database changes.
   * Get queries are executed as-is. Create, update and delete
   * actions will return data as if it was executed.
   * Example query:
   * ```
   * dry {
   *   createPost(title:"test") {
   *     id title
   *   }
   * }
   * ```
   * Will return the following result:
   * ```
   * {
   *   "createPost": {
   *     "__type": "Post",
   *     "id": "1cvw",
   *     "title": "test"
   *   }
   * }
   * ```
   * The returned id is an obfuscation of the id 0.
   * Nothing was written to the database.
   */
  it('can dry execute create operation', () => {
    let count;
    const countQuery = `{countPost}`;
    const query = `dry {
      createPost(title:"test") {
        id title
      }
    }`;
    return storage.query(countQuery).then(result => {
      count = result.countPost;
      return storage.query(query);
    }).then(result => {
      // Id looks like a real id, but is the obfuscation of 0.
      expect(result.createPost).to.have.property('id', new Ids(0).id);
    }).delay(10).then(() => {
      return storage.query(countQuery);
    }).then(result => {
      expect(result.countPost).to.equal(count);
    });
  });

  it('can dry execute update operation', () => {
    let id;
    return storage.query('{createPost(title:"foo"){id}}').then(result => {
      id = result.createPost.id;
      return storage.query('dry {updatePost(id:?,title:"bar"){id}}', [id]);
    }).delay(10).then(() => {
      return storage.query('{Post(id:?){title}}', [id]);
    }).then(result => {
      expect(result.Post.title).to.equal('foo');
    });
  });

  it('can dry execute delete operation', () => {
    let id;
    return storage.query('{createPost(title:"foo"){id}}').then(result => {
      id = result.createPost.id;
      return storage.query('dry {deletePost(id:?)}', [id]);
    }).delay(10).then(() => {
      return storage.query('{Post(id:?){title}}', [id]);
    }).then(result => {
      expect(result.Post.title).to.equal('foo');
    });
  });

  it('will return real results when executing dry read', () => {
    let id;
    return storage.query('{createPost(title:"Test!"){id}}').then(result => {
      id = result.createPost.id;
      return storage.query('{Post(id:?){title}}', [id]);
    }).then(result => {
      expect(result.Post.title).to.equal('Test!');
    });
  });

  it('will return validation errors on dry-run', () => {
    return Promise.resolve().then(() => {
      return storage.query('{createPost(teststring:123)}');
    }).then(() => {
      throw new Error('Query passed');
    }).catch(error => {});
  });
});
