'use strict';

const _ = require('lodash');
const Validator = require('is-my-json-valid');
const Crypto = require('crypto');

const Context = require('./Context');
const Password = require('./Password');

const tokenValidator = Validator({
  type: 'object',
  required: ['grant_type', 'username', 'password'],
  properties: {
    grant_type: {
      type: 'string',
      'enum': ['password']
    },
    username: {
      type: 'string'
    },
    password: {
      type: 'string'
    }
  }
});

class Authentication {
  constructor(app, storage, options) {
    this.app = app;
    this.storage = storage;
    this.options = _.defaults(options, {
      userFields: ['id'],
      userModel: 'User',
      usernameField: 'username',
      passwordField: 'password',
      password: {},
      admins: {}
    });
    this.password = new Password(this.options.password);

    const self = this;
    app.authentication(function() {
      let context = new Context();
      let promise;
      let authnHeader = typeof this.headers.authorization === 'string' ? this.headers.authorization : '';

      // Check Basic auth - used for admin tokens.
      let parts = authnHeader.match(/^Basic (.+)$/);
      if (parts) {
        parts = new Buffer(parts[1], 'base64').toString().split(':');
        const username = parts[0];
        const password = parts[1];
        if (self.options.admins[username] !== 'undefined' && self.password.isValid(self.options.admins[username], password)) {
          // Authenticated as admin user.
          // Allow execution of context-free queries.
          context = undefined;
        }
      }

      // Check Bearer token.
      parts = authnHeader.match(/^Bearer (.+)$/);
      if (parts) {
        const fields = self.options.userFields.join(' ');
        const query = '{token:listAuthnToken(token:?){user{' + fields + '}}}';
        const args = [parts[1]];
        promise = storage.query(query, args).then(result => {
          if (result.token.length) {
            context.setUser(result.token[0].user);
          }
          else {
            throw Error('Invalid access token');
          }
        });
      }
      return Promise.resolve(promise).then(() => {
        this.setParameter('context', context);
      });
    });

    app.postvalidation('POST /token', function() {
      if (!tokenValidator(this.body)) {
        throw new Error(tokenValidator.error);
      }
    });
    app.process('POST /token', function() {
      let token;
      if (this.body.grant_type === 'password') {
        const query = `{
          user: list${self.options.userModel} (${self.options.usernameField}: ?) {
            id
            password: ${self.options.passwordField}
          }
        }`;
        const args = [this.body.username];
        return self.storage.query(query, args).then(result => {
          let valid = result.user.length > 0 && self.password.isValid(result.user[0].password, this.body.password);
          if (valid) {
            token = Crypto.randomBytes(32).toString('base64');
            const query = '{createAuthnToken(token:?,user:?){id}}';
            const args = [token, result.user[0].id];
            return self.storage.query(query, args);
          }
        }).then(() => {
          if (token) {
            // @todo: Add expires_in (number of seconds).
            return {
              access_token: token,
              token_type: 'bearer'
            };
          }
          else {
            this.status = 401;
            return {};
          }
        });
      }
    });
  }
}

module.exports = Authentication;
