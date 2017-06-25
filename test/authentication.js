/* eslint-env node, mocha */
'use strict';

const Crypto = require('crypto');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const fetch = require('node-fetch');

const Container = require('../classes/container');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('Authentication', () => {
  let container;
  let accessToken;
  let userId;

  const uri = 'http://localhost:10023';

  before(async () => {
    container = new Container();
    await container.startup();

    const config = await container.get('Config');
    config.set({
      port: 10023,
      authentication: {
        admins: {
          admin: 'pbkdf2$sha256$7ps$w$ROMbPRTvX0w=$cTFu+GcA562wCATxUcNlR0cbKx7nG6fBU0IsS5wWusI='
        },
        userFields: ['id', 'admin'],
        usernameField: 'mail'
      },
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
    await container.get('Application');
  });

  after(async () => {
    await container.shutdown();
  });

  it('cannot create User without authentication', () => {
    const query = '{createUser(name:"Alice",mail:"alice@example.com",password:""){id}}';
    return fetch(uri + '/graphql?q=' + encodeURIComponent(query)).then(response => {
      expect(response.status).to.equal(403);
    });
  });

  it('can create User as admin', () => {
    const options = {
      headers: {
        Authorization: 'Basic ' + (new Buffer('admin:secret').toString('base64'))
      }
    };
    const query = '{createUser(name:"Alice",mail:"alice@example.com",password:"Welcome!"){id}}';
    return fetch(uri + '/graphql?q=' + encodeURIComponent(query), options).then(response => {
      expect(response.status).to.equal(200);
      return response.json();
    }).then(body => {
      expect(body.data).to.have.property('createUser');
      expect(body.data.createUser).to.have.property('id');
      expect(body.data.createUser.id).to.be.a('string');
      userId = body.data.createUser.id;
    });
  });

  it('will not provide an access token with invalid password', () => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'password',
        username: 'alice@example.com',
        password: 'invalid'
      })
    };
    return fetch(uri + '/token', options).then(response => {
      expect(response.status).to.equal(401);
    });
  });

  it('will not provide an access token with invalid grant_type', () => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        grant_type: 'test',
        username: 'alice@example.com',
        password: 'Welcome!'
      })
    };
    return fetch(uri + '/token', options).then(response => {
      // The request body is invalid, should give a 400 Bad Request.
      expect(response.status).to.equal(400);
    });
  });

  it('will provide an access token with valid password', () => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'password',
        username: 'alice@example.com',
        password: 'Welcome!'
      })
    };
    return fetch(uri + '/token', options).then(response => {
      expect(response.status).to.equal(200);
      return response.json();
    }).then(body => {
      expect(body.token_type).to.equal('bearer');
      expect(body.access_token).to.be.a('string');
      accessToken = body.access_token;
    });
  });

  it('can get user proflle using access token', () => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        query: '{user:User(id:$userId){id, name}}',
        variables: {userId}
      })
    };
    return fetch(uri + '/graphql', options).then(response => {
      expect(response.status).to.equal(200);
      return response.json();
    }).then(body => {
      expect(body.data).have.property('user');
      expect(body.data.user).have.property('id', userId);
      expect(body.data.user).have.property('name', 'Alice');
    });
  });

  it('can get user proflle without specifying user id', () => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        query: '{user:User{id, name}}'
      })
    };
    return fetch(uri + '/graphql', options).then(response => {
      expect(response.status).to.equal(200);
      return response.json();
    }).then(body => {
      expect(body.data).have.property('user');
      expect(body.data.user).have.property('id', userId);
      expect(body.data.user).have.property('name', 'Alice');
    });
  });

  it('will return null for user proflle when not authenticated', () => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: '{user:User{id, name}}'
      })
    };
    return fetch(uri + '/graphql', options).then(response => {
      expect(response.status).to.equal(200);
      return response.json();
    }).then(body => {
      expect(body.data).have.property('user', null);
    });
  });

  it('cannot get user profile using wrong access token', () => {
    const accessToken = Crypto.randomBytes(32).toString('base64');
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        query: '{user:User(id:$userId){id, name}}',
        variables: {userId}
      })
    };
    return fetch(uri + '/graphql', options).then(response => {
      expect(response.status).to.equal(401);
      return response.json();
    }).then(body => {
      expect(body).to.not.have.property('data');
    });
  });

  it('can pass access check with query function', () => {
    // The access function is 'q("rank").rank >= i.rank'.
    // The user has rank 10, so this test should pass.
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        query: '{story: createStory(title:$title,body:$body,rank:5){id}}',
        variables: {title: 'test', body: 'test'}
      })
    };
    return fetch(uri + '/graphql', options).then(response => {
      expect(response.status).to.equal(200);
    });
  });

  it('can pass access check that rely on default values', () => {
    // The access function is 'q("rank").rank >= i.rank'.
    // i.rank is not provided, but has a default value of 1.
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        query: '{story: createStory(title:$title,body:$body){id}}',
        variables: {title: 'test', body: 'test'}
      })
    };
    return fetch(uri + '/graphql', options).then(response => {
      expect(response.status).to.equal(200);
    });
  });

  it('can deny access with query function', () => {
    // The access function is 'q("rank").rank >= i.rank'.
    // The user has rank 10, so we may not post a Story with rank 15.
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        query: '{story: createStory(title:$title,body:$body,rank:15){id}}',
        variables: {title: 'test', body: 'test'}
      })
    };
    return fetch(uri + '/graphql', options).then(response => {
      expect(response.status).to.equal(403);
    });
  });
});
