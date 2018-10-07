/* eslint-env node, mocha */
/* eslint-disable no-await-in-loop */
'use strict';

const {mkdirSync, writeFileSync} = require('fs');
const {randomBytes} = require('crypto');
const chai = require('chai');
const Rimraf = require('rimraf');

const Container = require('../classes/container');

const expect = chai.expect;

describe('Config Files', () => {
  let container;
  let scripts;
  let dir;

  before(async () => {
    container = new Container();
    await container.startup();

    dir = '/tmp/' + randomBytes(8).toString('hex');
    mkdirSync(dir);
    mkdirSync(dir + '/scripts');

    writeFileSync(dir + '/scripts/test.scr', '# Test');

    const config = await container.get('Config');
    config.set({
      port: 1234,
      configDir: dir,
      database: 'mysql:root:password@127.0.0.1/litsor',
      'recreate-db': true,
      'secret-key': 'test',
      reload: true
    });

    scripts = await container.get('ScriptsManager');
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
  });

  after(async () => {
    await container.shutdown();
    await Rimraf.sync(dir);
  });

  it('will load the testfile', async () => {
    expect(scripts.getNames().indexOf('Test') >= 0).to.equal(true);
  });

  it('will reload files', async () => {
    expect(scripts.getNames()).to.not.contain('NewScript');

    writeFileSync(dir + '/scripts/new.scr', '# NewScript');

    // Reloading may take some time. Wait till we have it.
    for (let i = 0; i < 24; ++i) {
      await new Promise(resolve => {
        setTimeout(resolve, 250);
      });
      if (scripts.getNames().indexOf('NewScript') >= 0) {
        break;
      }
    }

    expect(scripts.getNames()).to.contain('NewScript');
  }).timeout(10000);

  it('cannot get unexisting items', async () => {
    expect(() => {
      scripts.get('Unknown');
    }).to.throw('No scripts found with name "Unknown"');
  });
});
