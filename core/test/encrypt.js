/* eslint-env node, mocha */
'use strict';

const chai = require('chai');

const Container = require('../classes/container');

const expect = chai.expect;

describe('Encrypt', () => {
  let container;
  let otherContainer;
  let encrypt;
  let otherEncrypt;

  before(async () => {
    container = new Container();
    await container.startup();
    const config = await container.get('Config');
    // config.set({'secret-key': 'first app'});
    encrypt = await container.get('Encrypt');

    otherContainer = new Container();
    await otherContainer.startup();
    const otherConfig = await otherContainer.get('Config');
    otherConfig.set({'secret-key': 'second app'});
    otherEncrypt = await otherContainer.get('Encrypt');
  });

  after(async () => {
    await container.shutdown();
    await otherContainer.shutdown();
  });

  it('can encrypt and decrypt data', async () => {
    const encrypted = encrypt.encrypt('test');
    const decrypted = encrypt.decrypt(encrypted);
    expect(decrypted).to.equal('test');
  });

  it('uses different initializing vector (iv) for each call', async () => {
    const encrypted1 = encrypt.encrypt('test');
    const encrypted2 = encrypt.encrypt('test');
    expect(encrypted1).to.not.equal(encrypted2);
  });

  it('can generate a hash', async () => {
    const hash1 = encrypt.hash('foo');
    const hash2 = encrypt.hash('foo');
    expect(hash1).to.equal(hash2);
    const hash3 = encrypt.hash('bar');
    expect(hash1).to.not.equal(hash3);
  });

  it('will generate consistent hashes, independent from secret key', async () => {
    const hash = encrypt.hash('foo');
    const otherHash = otherEncrypt.hash('foo');
    expect(otherHash).to.equal(hash);
  });

  it('can generate hmac', async () => {
    const hmac1 = encrypt.hmac('foo');
    const hmac2 = encrypt.hmac('foo');
    expect(hmac1).to.equal(hmac2);
    const hmac3 = encrypt.hmac('bar');
    expect(hmac1).to.not.equal(hmac3);
  });

  it('will generate different hmacs, dependent of secret key', async () => {
    const hmac = encrypt.hmac('foo');
    const otherHmac = otherEncrypt.hmac('foo');
    expect(otherHmac).to.not.equal(hmac);
  });

});
