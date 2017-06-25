/* eslint-env node, mocha */
'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const expect = chai.expect;

const Container = require('../classes/container');

describe('Storage', () => {
  let container;
  let storage;
  let temporary = {};

  before(async () => {
    container = new Container();
    await container.startup();

    const config = await container.get('Config');
    config.set({
      storage: {
        modelsDir: 'test/models',
        databases: {
          internal: {
            engine: 'redis',
            host: 'localhost',
            port: 6379,
            prefix: ''
          },
          rethink: {
            engine: 'RethinkDB',
            host: 'localhost',
            port: 28015,
            name: 'test'
          }
        }
      }
    });
    storage = await container.get('Storage');
  });

  after(async () => {
    await container.shutdown();
  });

  it('knows that is has a User model', () => {
    return storage.models.has('User').then(result => {
      expect(result).to.equal(true);
    });
  });

  it('knows that is does not have a People model', () => {
    return storage.models.has('People').then(result => {
      expect(result).to.equal(false);
    });
  });

  it('can create a User', () => {
    const query = `{
      createUser(name: "John", mail: "john@example.com") {
        id name mail
      }
    }`;
    return storage.query(query).then(result => {
      expect(result).to.have.property('createUser');
      expect(result.createUser).to.have.property('id');
      temporary = result.createUser;
    });
  });

  it('can read User', () => {
    const query = `{
      readUser(id: $id) {
        id name mail
      }
    }`;
    const id = temporary.id;
    return storage.query(query, {id}).then(result => {
      expect(result.readUser.id).to.equal(temporary.id);
      expect(result.readUser.name).to.equal(temporary.name);
      expect(result.readUser.mail).to.equal(temporary.mail);
    });
  });

  it('can list Users', () => {
    const query = `{
      listUser {
        id name mail
      }
    }`;
    return storage.query(query).then(result => {
      // Other testcases may have added users as well, so check >= 1.
      expect(result.listUser.length >= 1).to.equal(true);
      let found = false;
      result.listUser.forEach(user => {
        if (user.id === temporary.id) {
          found = true;
          expect(user.name).to.equal(temporary.name);
          expect(user.mail).to.equal(temporary.mail);
        }
      });
      expect(found).to.equal(true);
    });
  });

  it('can create a second User', () => {
    const query = `{
      createUser(name: "Bob", mail: "bob@example.com") {
        id name mail
      }
    }`;
    return storage.query(query).then(result => {
      expect(result).to.have.property('createUser');
      expect(result.createUser).to.have.property('id');
    });
  });

  it('will list both Users', () => {
    const query = `{
      listUser {
        id name mail
      }
    }`;
    return storage.query(query).then(result => {
      // Other testcases may have added users as well, so check >= 2.
      expect(result.listUser.length >= 2).to.equal(true);
    });
  });

  it('can filter list on indexed field', () => {
    const query = `{
      listUser(mail:"john@example.com") {
        id name mail
      }
    }`;
    return storage.query(query).then(result => {
      expect(result.listUser).to.have.length(1);
    });
  });

  it('can filter list on non-indexed field', () => {
    const query = `{
      listUser(name:"John") {
        id name mail
      }
    }`;
    return storage.query(query).then(result => {
      expect(result.listUser).to.have.length(1);
    });
  });

  it('can filter list on multiple fields', () => {
    const query = `{
      listUser(name:"John",mail:"bob@example.com") {
        id name mail
      }
    }`;
    return storage.query(query).then(result => {
      // The combination with name and mail does not exist.
      expect(result.listUser).to.have.length(0);
    });
  });

  it('can count Users', () => {
    const query = `{
      countUser
    }`;
    return storage.query(query).then(result => {
      // Other testcases may have added users as well, so check >= 2.
      expect(result.countUser >= 2).to.equal(true);
    });
  });

  it('can count Users with filter', () => {
    const query = `{
      countUser (name:"John",mail:"john@example.com")
    }`;
    return storage.query(query).then(result => {
      expect(result.countUser).to.equal(1);
    });
  });

  it('can update User', () => {
    const query = `{
      updateUser(id: $id, name: "Alice") {
        id name mail
      }
    }`;
    const id = temporary.id;
    return storage.query(query, {id}).then(result => {
      expect(result.updateUser.id).to.equal(temporary.id);
      expect(result.updateUser.name).to.equal('Alice');
      expect(result.updateUser.mail).to.equal(temporary.mail);
    });
  });

  it('can delete User', () => {
    const query = `{
      deleteUser(id: $id)
    }`;
    const id = temporary.id;
    return storage.query(query, {id}).then(result => {
      expect(result.deleteUser.id).to.equal(undefined);
    });
  });
});
