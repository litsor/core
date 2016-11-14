'use strict';

const Fs = require('fs');
const Path = require('path');

const _ = require('lodash');
const Dicer = require('dicer');

class FilesApi {
  constructor(app, storage) {
    this.app = app;
    this.storage = storage;

    app.process('PUT /file/<model:string>', (model, request, context) => {
      let id;
      let directory;
      let modelInstance;
      const query = `{file:create${model} {id}}`;
      return this.storage.query(query, context).then(result => {
        id = result.file.id;
        return this.storage.models.get(model);
      }).then(_model => {
        modelInstance = _model;
        directory = modelInstance.getDirectory(id);
        return this.processUploadStream(id, directory, request.body);
      }).then(() => {
        return {id};
      }).catch(err => {
        if (err.message === 'Query error: Permission denied') {
          request.status = 403;
          return {errors: [{message: 'Permission denied'}]};
        }
        throw err;
      });
    });

    app.prevalidation('POST /file/<model:string>', request => {
      if (!request.multipartBoundary) {
        throw new Error('Request body is not a multipart message');
      }
    });
    app.process('POST /file/<model:string>', (model, request, context) => {
      let id;
      let directory;
      let modelInstance;
      const query = `{file:create${model} {id}}`;
      return this.storage.query(query, context).then(result => {
        id = result.file.id;
        return this.storage.models.get(model);
      }).then(_model => {
        modelInstance = _model;
        directory = modelInstance.getDirectory(id);
        return this.processMultipart(id, directory, request.body, request.multipartBoundary);
      }).then(fields => {
        return this.saveFields(id, modelInstance, fields);
      }).catch(err => {
        if (err.message === 'Query error: Permission denied') {
          request.status = 403;
          return {errors: [{message: 'Permission denied'}]};
        }
        throw err;
      });
    });

    app.process('GET /file/<model:string>/<id:string>', (model, id, context, request) => {
      let modelInstance;
      const query = `{file:${model}(id:?){id}}`;
      const args = [id];
      return this.storage.query(query, context, args).then(result => {
        if (result.file === null) {
          throw new Error('Not found');
        }
        id = result.file.id;
        return this.storage.models.get(model);
      }).then(_model => {
        modelInstance = _model;
        const directory = modelInstance.getDirectory(id);
        const filename = Path.join(directory, id + '.0');
        return Fs.createReadStream(filename);
      }).catch(err => {
        if (err.message === 'Not found') {
          request.status = 404;
          return {errors: [{message: 'Not found'}]};
        }
        if (err.message === 'Query error: Permission denied') {
          request.status = 403;
          return {errors: [{message: 'Permission denied'}]};
        }
        throw err;
      });
    });
  }

  saveFields(id, model, fields) {
    const data = _.clone(fields);
    data.id = id;
    // @todo: Save data
    return data;
  }

  processUploadStream(id, directory, stream) {
    return new Promise((resolve, reject) => {
      const filename = Path.join(directory, id + '.0');
      const file = Fs.createWriteStream(filename);
      stream.on('end', resolve);
      stream.on('error', reject);
      stream.pipe(file);
    });
  }

  processMultipart(id, directory, stream, boundary) {
    let _resolve;
    let _reject;
    const defer = new Promise((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });
    const fields = {};
    const filename = Path.join(directory, id + '.0');
    const dicer = new Dicer({boundary});
    dicer.on('part', part => {
      let info;
      part.on('header', data => {
        info = this.parseHeaders(data);
        if (info.name === 'file') {
          const file = Fs.createWriteStream(filename);
          part.pipe(file);
        } else {
          const chunks = [];
          part.on('data', chunk => {
            chunks.push(chunk);
          });
          part.on('end', () => {
            fields[info.name] = Buffer.concat(chunks);
          });
        }
      });
    });
    dicer.on('finish', () => {
      _resolve(fields);
    });
    dicer.on('error', err => {
      _reject(err);
    });
    stream.pipe(dicer);
    return defer;
  }

  /**
   * Parse headers of a multipart message part.
   */
  parseHeaders(headers) {
    let name = null;
    let filename = null;
    let contentType = null;
    if (headers['content-disposition'] instanceof Array) {
      name = String(headers['content-disposition'][0]).match(/name="([^"]+)"/);
      name = name === null ? null : name[1];
      filename = String(headers['content-disposition']).match(/filename="([^"]+)"/);
      filename = filename === null ? null : filename[1];
    }
    if (headers['content-type'] instanceof Array) {
      contentType = headers['content-type'][0];
    }
    return {name, filename, contentType};
  }
}

module.exports = FilesApi;
