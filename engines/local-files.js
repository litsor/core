'use strict';

const Path = require('path');

const _ = require('lodash');
const Bluebird = require('bluebird');
const Fs = Bluebird.promisifyAll(require('fs-extra'));

const Model = require('../classes/model');

/**
 * @doc internals/storage/local-files
 * @title Local files
 *
 * All data is stored on disk. Each entry
 * must have an ``{id}.meta`` file. This file
 * will contain metadata and all field data
 * in JSON format. Properties are:
 * * finished (boolean)
 *   Indicates if file is uploaded and complete.
 * * _parts (int)
 *   Array of parts on disk. Each item is an
 *   object with the following properties:
 *   * finished (boolean)
 *   * size (int)
 */
class LocalFiles extends Model {
  constructor(modelData, database, internalDatabase) {
    super(modelData, database, internalDatabase);

    database = _.defaults(database, {
      directory: '/files'
    });

    this.directory = database.directory;
    this.privateProperties = ['_parts'];
  }

  getDirectory(id) {
    const subdir = id.substring(0, 2).toLowerCase();
    return Path.join(this.directory, subdir);
  }

  ensureDirectory(id) {
    const directory = this.getDirectory(id);
    return Fs.ensureDirAsync(directory).then(() => {
      return directory;
    });
  }

  ready() {
    return true;
  }

  read(data) {
    const dir = this.getDirectory(data.id);
    const filename = Path.join(dir, data.id + '.meta');
    return Fs.readFileAsync(filename).then(contents => {
      return _.omit(JSON.parse(contents), this.privateProperties);
    }).catch(() => {
      throw new Error('File not found');
    });
  }

  create(data) {
    data.finished = false;
    data._parts = [];
    return this.ensureDirectory(data.id).then(dir => {
      const filename = Path.join(dir, data.id + '.meta');
      return Fs.writeFileAsync(filename, JSON.stringify(data));
    }).then(() => {
      return _.omit(data, this.privateProperties);
    });
  }

  update(data) {
    return this.read({id: data.id}).then(original => {
      data = _.defaults(data, original);
      const dir = this.getDirectory(data.id);
      const filename = Path.join(dir, data.id + '.meta');
      return Fs.writeFileAsync(filename, JSON.stringify(data));
    }).then(() => {
      return _.omit(data, this.privateProperties);
    });
  }

  remove(data) {
    return this.read({id: data.id}).then(data => {
      const files = [];
      const dir = this.getDirectory(data.id);
      files.push(Path.join(dir, data.id + '.meta'));
      for (let i = 0; i < data._parts.length; ++i) {
        files.push(Path.join(dir, data.id + '.' + i));
      }
      return files;
    }).each(file => {
      return Fs.unlinkAsync(file);
    }).then(() => {
      return {id: data.id};
    });
  }
}

module.exports = LocalFiles;
