/* eslint-env node, mocha */
'use strict';

const {stringify} = require('querystring');
const {resolve, parse} = require('url');
const chai = require('chai');
const fetch = require('node-fetch');
const {JSDOM} = require('jsdom');
const parseForm = require('form-parse');

const Container = require('../classes/container');

const expect = chai.expect;

describe('OAuth', () => {
  const temporary = {};
  let container;
  let testUrl;
  let scriptsManager;
  let db;

  before(async () => {
    container = new Container();
    await container.startup();

    const config = await container.get('Config');
    config.set({
      port: 1234,
      configDir: 'core/test/oauth',
      database: 'mysql:root:password@127.0.0.1/restapir',
      'recreate-db': true,
      'secret-key': 'test'
    });
    testUrl = 'http://127.0.0.1:1234';
    await container.get('Endpoints');
    await container.get('GraphqlLinks');

    db = await container.get('Database');

    scriptsManager = await container.get('ScriptsManager');
    const create = scriptsManager.get('StorageInternalCreate');
    await create.run({
      model: 'User',
      input: {
        name: 'alice',
        password: 'Welcome01!!',
        blocked: false,
        scope: '*'
      }
    });
    const promises = [{
      name: 'Client A - Untrusted public client',
      type: 'public',
      trusted: false,
      secret: null
    }, {
      name: 'Client B - Trusted public client',
      type: 'public',
      trusted: true,
      secret: null
    }, {
      name: 'Client C - Untrusted public client',
      type: 'public',
      trusted: false,
      secret: null
    }, {
      name: 'Client D - Trusted confidential client',
      type: 'confidential',
      trusted: true,
      secret: 'topsecret'
    }].map(({name, type, trusted, secret}) => {
      return create.run({
        model: 'OauthClient',
        input: {
          name,
          type,
          trusted,
          secret,
          redirectUri: 'https://example.com/callback',
          created: ~~(new Date() / 1e3)
        }
      });
    });
    const [untrustedPublicClient, trustedPublicCilent, untrustedPublicClient2, trustedConfidentialClient] = await Promise.all(promises);
    temporary.untrustedPublicClient = untrustedPublicClient.id;
    temporary.trustedPublicCilent = trustedPublicCilent.id;
    temporary.untrustedPublicClient2 = untrustedPublicClient2.id;
    temporary.trustedConfidentialClient = trustedConfidentialClient.id;
  });

  after(async () => {
    await container.shutdown();
  });

  const authenticateRequest = async ({clientId, responseType}) => {
    const query = stringify({
      response_type: responseType || 'code',
      client_id: clientId || temporary.untrustedPublicClient,
      scope: 'read write',
      state: 'Teststate',
      redirect: 'manual'
    });
    const result = await fetch(testUrl + '/oauth/authorize?' + query);
    expect(result.status).to.equal(200);
    expect(result.headers.get('content-type')).to.equal('text/html; charset=utf-8');
    // @see https://tools.ietf.org/html/rfc6749#section-10.13
    expect(result.headers.get('x-frame-options')).to.equal('DENY');
    return result.text();
  };

  const login = async options => {
    const {remember, username, password} = options;
    const html = await authenticateRequest(options);
    const dom = new JSDOM(html);
    const form = dom.window.document.getElementsByTagName('form')[0];
    expect(typeof form).to.equal('object', 'Page must contain a form');
    const values = parseForm(form);
    expect(values).to.have.property('username');
    expect(values).to.have.property('password');
    const action = resolve(testUrl, form.getAttribute('action'));
    values.username = username || 'alice';
    values.password = password || 'Welcome01!!';
    if (remember) {
      values.remember = 'remember';
    }
    return fetch(action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: stringify(values),
      redirect: 'manual'
    });
  };

  // @see https://tools.ietf.org/html/rfc6749#section-4.1.1
  it('can access the authorization page', async () => {
    const query = stringify({
      response_type: 'code',
      client_id: temporary.untrustedPublicClient,
      redirect_uri: 'https://example.com/callback',
      scope: 'read write',
      state: 'Teststate'
    });
    const result = await fetch(testUrl + '/oauth/authorize?' + query);
    expect(result.status).to.equal(200);
    expect(result.headers.get('content-type')).to.equal('text/html; charset=utf-8');
    // @see https://tools.ietf.org/html/rfc6749#section-10.13
    expect(result.headers.get('x-frame-options')).to.equal('DENY');
    temporary.html = await result.text();
  });

  it('returns the login page', async () => {
    const dom = new JSDOM(temporary.html);
    const form = dom.window.document.getElementsByTagName('form')[0];
    expect(typeof form).to.equal('object', 'Page must contain a form');
    const values = parseForm(form);
    expect(values).to.have.property('username');
    expect(values).to.have.property('password');
    const action = resolve(testUrl, form.getAttribute('action'));

    values.username = 'alice';
    values.password = 'Welcome01!!';
    const result = await fetch(action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: stringify(values)
    });
    expect(result.status).to.equal(200);
    expect(result.headers.has('set-cookie')).to.equal(true);
    const cookieHeaders = (result.headers.get('set-cookie') || []).split(/,[\s]*/).filter(str => str);
    temporary.cookies = cookieHeaders.reduce((prev, curr) => prev + curr.split(';')[0] + ';', '');
    expect(result.headers.get('content-type')).to.equal('text/html; charset=utf-8');
    temporary.html = await result.text();
  });

  it('returns the authorization page', async () => {
    // This is not a trusted client, so we have to accept this application.
    // This page must at least mention the client name.
    expect(temporary.html).to.contain('Client A');
  });

  it('can authorize application', async () => {
    const dom = new JSDOM(temporary.html);
    const form = dom.window.document.getElementsByTagName('form')[0];
    expect(typeof form).to.equal('object', 'Page must contain a form');
    const values = parseForm(form);
    const action = resolve(testUrl, form.getAttribute('action'));
    const result = await fetch(action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Set-Cookie': temporary.cookies
      },
      body: stringify(values),
      redirect: 'manual'
    });
    expect(result.status).to.equal(302);
    expect(result.headers.get('content-type')).to.equal('text/html; charset=utf-8');
    expect(result.headers.has('location')).to.equal(true);

    // @see https://tools.ietf.org/html/rfc6749#section-5.1
    expect(result.headers.get('cache-control')).to.equal('no-store');
    expect(result.headers.get('pragma')).to.equal('no-cache');

    temporary.location = result.headers.get('location');
    expect(temporary.location.startsWith('https://example.com/callback')).to.equal(true);
  });

  it('will redirect to redirect_uri with code', async () => {
    const url = parse(temporary.location, true);
    expect(url.query).to.have.property('code');
    expect(url.query).to.have.property('state', 'Teststate');
    temporary.code = url.query.code;
  });

  // @see https://tools.ietf.org/html/rfc6749#section-4.1.3
  it('can retrieve the access token with the autorization code', async () => {
    const body = {
      grant_type: 'authorization_code',
      client_id: temporary.untrustedPublicClient,
      code: temporary.code,
      redirect_url: 'http://example.com/'
    };
    const result = await fetch('http://127.0.0.1:1234/oauth/token', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: stringify(body)
    });
    expect(result.status).to.equal(200);
    expect(result.headers.get('content-type')).to.equal('application/json; charset=utf-8');

    // @see https://tools.ietf.org/html/rfc6749#section-5.1
    expect(result.headers.get('cache-control')).to.equal('no-store');
    expect(result.headers.get('pragma')).to.equal('no-cache');

    const response = await result.json();
    expect(response).to.have.property('access_token');
    expect(response).to.have.property('token_type', 'bearer');
    // Expires is not required by OAuth2, but we will follow the recommendation to always use it.
    expect(response).to.have.property('expires_in');
    expect(response.expires_in >= 43199 && response.expires_in <= 43201).to.equal(true);

    temporary.access_token = response.access_token;
  });

  it('can use the access token to access a protected resource', async () => {
    const result = await fetch('http://127.0.0.1:1234/protected-resource', {
      headers: {Authorization: 'Bearer ' + temporary.access_token}
    });
    expect(result.status).to.equal(200);
  });

  it('cannot access the protected resource without token', async () => {
    const result = await fetch('http://127.0.0.1:1234/protected-resource');
    expect(result.status).to.equal(401);
  });

  it('cannot access the protected resource with an invalid token', async () => {
    const result = await fetch('http://127.0.0.1:1234/protected-resource', {
      headers: {Authorization: 'Bearer S25vY2sga25vY2suLi4gSXRzIG1l'}
    });
    expect(result.status).to.equal(401);
  });

  it('can provide the access token via X-Authorization header', async () => {
    const result = await fetch('http://127.0.0.1:1234/protected-resource', {
      headers: {'X-Authorization': 'Bearer ' + temporary.access_token}
    });
    expect(result.status).to.equal(200);
  });

  it('remembers the authorization', async () => {
    const query = stringify({
      response_type: 'code',
      client_id: temporary.untrustedPublicClient,
      scope: 'read write',
      state: 'Teststate'
    });
    const result = await fetch(testUrl + '/oauth/authorize?' + query, {
      headers: {
        'Set-Cookie': temporary.cookies
      },
      redirect: 'manual'
    });
    expect(result.status).to.equal(302);
    expect(result.headers.has('location')).to.equal(true);
    const url = parse(result.headers.get('location'), true);
    expect(url.query).to.have.property('code');

    // The authorization code should be deleted. We should get a new code.
    expect(url.query.code).to.not.equal(temporary.code);

    const body = {
      grant_type: 'authorization_code',
      client_id: temporary.untrustedPublicClient,
      code: url.query.code
    };
    const tokenResult = await fetch('http://127.0.0.1:1234/oauth/token', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: stringify(body)
    });
    expect(tokenResult.status).to.equal(200);
    const tokenResponse = await tokenResult.json();

    // The access token is still valid and should be reused.
    expect(tokenResponse).to.have.property('access_token', temporary.access_token);

    expect(tokenResponse).to.have.property('user_id', '1');
    expect(tokenResponse).to.have.property('token_type', 'bearer');
    expect(tokenResponse).to.have.property('expires_in');
    expect(tokenResponse.expires_in > 0).to.equal(true);
    expect(tokenResponse.expires_in >= 43200 - 10).to.equal(true);
  });

  it('does not require authorization for trusted clients', async () => {
    const query = stringify({
      response_type: 'code',
      client_id: temporary.trustedPublicCilent,
      scope: 'read write',
      state: 'Teststate'
    });
    const result = await fetch(testUrl + '/oauth/authorize?' + query, {
      headers: {
        'Set-Cookie': temporary.cookies
      },
      redirect: 'manual'
    });
    expect(result.status).to.equal(302);
    expect(result.headers.has('location')).to.equal(true);
  });

  it('requires authorization for other non-trusted clients', async () => {
    const query = stringify({
      response_type: 'code',
      client_id: temporary.untrustedPublicClient2,
      scope: 'read write',
      state: 'Teststate'
    });
    const result = await fetch(testUrl + '/oauth/authorize?' + query, {
      headers: {
        'Set-Cookie': temporary.cookies
      },
      redirect: 'manual'
    });
    expect(await result.text()).to.contain('Client C');
  });

  // @see https://tools.ietf.org/html/rfc6749#section-1.3.2
  it('can use the implicit flow', async () => {
    const query = stringify({
      response_type: 'token',
      client_id: temporary.untrustedPublicClient,
      scope: 'read',
      state: 'Teststate'
    });
    const result = await fetch('http://127.0.0.1:1234/oauth/authorize?' + query);
    expect(result.status).to.equal(200);
    expect(result.headers.get('content-type')).to.equal('text/html; charset=utf-8');
    temporary.html = await result.text();
  });

  it('returns the login page', async () => {
    const dom = new JSDOM(temporary.html);
    const form = dom.window.document.getElementsByTagName('form')[0];
    expect(typeof form).to.equal('object', 'Page must contain a form');
    const values = parseForm(form);
    expect(values).to.have.property('username');
    expect(values).to.have.property('password');
    const action = resolve(testUrl, form.getAttribute('action'));

    values.username = 'alice';
    values.password = 'Welcome01!!';
    const result = await fetch(action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: stringify(values)
    });
    expect(result.status).to.equal(200);
    const cookieHeaders = (result.headers.get('set-cookie') || '').split(/,[\s]*/).filter(str => str);
    temporary.cookies = cookieHeaders.reduce((prev, curr) => prev + curr.split(';')[0] + ';', '');
    expect(result.headers.get('content-type')).to.equal('text/html; charset=utf-8');
    temporary.html = await result.text();
  });

  it('returns the authorization page', async () => {
    // This is not a trusted client, so we have to accept this application.
    // This page must at least mention the client name.
    expect(temporary.html).to.contain('Client A');
  });

  it('can authorize application', async () => {
    const dom = new JSDOM(temporary.html);
    const form = dom.window.document.getElementsByTagName('form')[0];
    expect(typeof form).to.equal('object', 'Page must contain a form');
    const values = parseForm(form);
    const action = resolve(testUrl, form.getAttribute('action'));
    const result = await fetch(action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Set-Cookie': temporary.cookies
      },
      body: stringify(values),
      redirect: 'manual'
    });
    expect(result.status).to.equal(302);
    expect(result.headers.get('content-type')).to.equal('text/html; charset=utf-8');
    expect(result.headers.has('location')).to.equal(true);

    // @see https://tools.ietf.org/html/rfc6749#section-5.1
    expect(result.headers.get('cache-control')).to.equal('no-store');
    expect(result.headers.get('pragma')).to.equal('no-cache');

    temporary.location = result.headers.get('location');
    console.log(temporary.location);
    expect(temporary.location.startsWith('https://example.com/callback')).to.equal(true);
  });

  it('will redirect to redirect_uri with token', async () => {
    const url = parse(temporary.location, true);
    expect(url.hash).to.not.equal(null);
    const params = parse('?' + url.hash.substring(1), true).query;
    expect(params).to.have.property('token');
    expect(params).to.have.property('state', 'Teststate');
    temporary.access_token = params.token;
  });

  it('returns a refresh_token for confidential clients', async () => {
    const query = stringify({
      response_type: 'code',
      client_id: temporary.trustedConfidentialClient,
      scope: 'read write',
      state: 'Teststate'
    });
    const result = await fetch(testUrl + '/oauth/authorize?' + query, {
      headers: {
        'Set-Cookie': temporary.cookies
      },
      redirect: 'manual'
    });
    expect(result.status).to.equal(302);
    expect(result.headers.has('location')).to.equal(true);
    const url = parse(result.headers.get('location'), true);
    expect(url.query).to.have.property('code');

    const body = {
      grant_type: 'authorization_code',
      client_id: temporary.trustedConfidentialClient,
      code: url.query.code,
      redirect_url: 'http://example.com/',
      client_secret: 'topsecret'
    };
    const tokenResult = await fetch('http://127.0.0.1:1234/oauth/token', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: stringify(body)
    });
    expect(tokenResult.status).to.equal(200);
    const tokenResponse = await tokenResult.json();
    expect(tokenResponse).to.have.property('refresh_token');
    temporary.refresh_token = tokenResponse.refresh_token;
  });

  it('can use the refresh_token to obtain a new access token', async () => {
    const body = {
      grant_type: 'refresh_token',
      client_id: temporary.trustedConfidentialClient,
      refresh_token: temporary.refresh_token
    };
    const result = await fetch('http://127.0.0.1:1234/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(temporary.trustedConfidentialClient + ':topsecret').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: stringify(body)
    });
    expect(result.status).to.equal(200);
    expect(result.headers.get('content-type')).to.equal('application/json; charset=utf-8');

    // @see https://tools.ietf.org/html/rfc6749#section-5.1
    expect(result.headers.get('cache-control')).to.equal('no-store');
    expect(result.headers.get('pragma')).to.equal('no-cache');

    // @see https://tools.ietf.org/html/rfc6749#section-5.1
    const response = await result.json();
    expect(response).to.have.property('access_token');
    expect(response).to.have.property('token_type', 'bearer');
    // Expires is not required by OAuth2, but we will follow the recommendation to always use it.
    expect(response).to.have.property('expires_in', 43200);
    // We should get a new refresh token.
    expect(response).to.have.property('refresh_token');
    expect(response.refresh_token).to.not.equal(temporary.refresh_token);
    temporary.refresh_token = response.refresh_token;

    // An attempt to re-use the refresh_token should fail.
    const result2 = await fetch('http://127.0.0.1:1234/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(temporary.trustedConfidentialClient + ':topsecret').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: stringify(body)
    });
    expect(result2.status).to.equal(400);
  });

  it('cannot refresh token without client authentication', async () => {
    const body = {
      grant_type: 'refresh_token',
      client_id: temporary.trustedConfidentialClient,
      refresh_token: temporary.refresh_token
    };
    const result = await fetch('http://127.0.0.1:1234/oauth/token', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: stringify(body)
    });
    expect(result.status).to.equal(401);
  });

  it('can use client_secret to authenticate the client', async () => {
    const body = {
      grant_type: 'refresh_token',
      client_id: temporary.trustedConfidentialClient,
      refresh_token: temporary.refresh_token,
      client_secret: 'topsecret'
    };
    const result = await fetch('http://127.0.0.1:1234/oauth/token', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: stringify(body)
    });
    expect(result.status).to.equal(200);
  });

  it('can destroy the token by calling /logout', async () => {
    const result = await fetch('http://127.0.0.1:1234/logout', {
      headers: {Authorization: 'Bearer ' + temporary.access_token},
      redirect: 'manual'
    });
    expect(result.status).to.equal(302);
    const resourceResult = await fetch('http://127.0.0.1:1234/protected-resource', {
      headers: {Authorization: 'Bearer ' + temporary.access_token}
    });
    expect(resourceResult.status).to.equal(401);
  });

  it('can remember login', async () => {
    const result = await login({remember: false});
    expect(result.headers.get('set-cookie')).to.not.contain('expires');

    const result2 = await login({remember: true});
    expect(result2.headers.get('set-cookie')).to.contain('expires');
  });

  it('rejects wrong username', async () => {
    const result = await login({username: 'unknown'});
    expect(await result.text()).to.contain('Wrong username or password');
  });

  it('rejects wrong password', async () => {
    const result = await login({password: 'unknown'});
    expect(await result.text()).to.contain('Wrong username or password');
  });

  it('will reject access with an expired token', async () => {
    const result = await login({
      clientId: temporary.trustedPublicCilent,
      responseType: 'token'
    });
    const location = result.headers.get('location');
    expect(location).to.contain('token=');
    temporary.access_token = decodeURIComponent(location.match(/token=([^&]+)/)[1]);
    const checkAccess = async access => {
      const resourceResult = await fetch('http://127.0.0.1:1234/protected-resource', {
        headers: {Authorization: 'Bearer ' + temporary.access_token}
      });
      expect(resourceResult.status).to.equal(access ? 200 : 401);
    };
    // We should have access now.
    await checkAccess(true);
    // We should still have access after 11 hours, since the token is valid for 12 hours.
    await db.query('UPDATE oauth_access_token SET expires = expires - 39600');
    await checkAccess(true);
    // We should should not have access after another 2 hours.
    await db.query('UPDATE oauth_access_token SET expires = expires - 7200');
    await checkAccess(false);
  });

  it('will cleanup old tokens', async () => {
    const checkExists = async exists => {
      const records = await db.query('SELECT * FROM oauth_access_token WHERE token = :token', {
        token: temporary.access_token
      });
      expect(records[0].length > 0).to.equal(exists);
    };
    await checkExists(true);
    await scriptsManager.get('OauthCleanup').run({});
    await checkExists(false);
  });
});
