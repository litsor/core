'use strict';

const _ = require('lodash');
const HttpError = require('http-errors');

const Script = require('./script');

class ScriptApi {
  constructor(app, storage) {
    this.app = app;
    this.storage = storage;

    app.authorisation('POST /script', admin => {
      if (!admin) {
        throw new HttpError(403, 'Unauthorized');
      }
    });

    app.process('POST /script', request => {
      const body = _.defaults(request.body, {
        input: {},
        options: {}
      });

      const script = new Script(body.definition, this.storage, body.options);
      return script.run(body.input).then(output => {
        return {data: output};
      });
    });
  }
}

module.exports = ScriptApi;
