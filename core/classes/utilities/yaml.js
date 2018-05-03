'use strict';

const Fs = require('fs');
const {promisify} = require('util');
const globby = require('globby');
const JsYaml = require('js-yaml');

const readFile = promisify(Fs.readFile);
const writeFile = promisify(Fs.writeFile);

class Yaml {
  async readFiles(pattern) {
    const files = await globby(pattern);
    const output = {};
    const promises = files.map(file => {
      return readFile(file);
    });
    (await Promise.all(promises)).forEach((contents, index) => {
      const file = files[index];
      try {
        output[file] = JsYaml.safeLoad(contents);
      } catch (err) {
        console.log(`Unable to parse file ${file}: ${err.message}`);
      }
    });
    return output;
  }

  async readFile(filename) {
    return JsYaml.safeLoad((await readFile(filename)).toString());
  }

  async writeFile(filename, contents) {
    await writeFile(filename, JsYaml.safeDump(contents));
  }
}

Yaml.singleton = true;

module.exports = Yaml;
