/* eslint-disable new-cap */
'use strict';

const Sequelize = require('sequelize');
const {snakeCase} = require('lodash');

class Database {
  constructor({Config, Log}) {
    this.log = Log;
    this.database = Config.get('/database', 'sqlite:data/data.db');
    this.recreate = Boolean(Config.get('/recreate-db', false));
    this.client = null;
    this.databaseModels = {};
    this.retryIn = 0;
    this.connected = new Promise(resolve => {
      this.resolveConnected = resolve;
    });
  }

  getType(schema) {
    if (schema.type === 'string' && typeof schema.maxLength !== 'undefined' && schema.maxLength <= 255) {
      return Sequelize.STRING(schema.maxLength);
    }
    if (schema.type === 'string') {
      if (Array.isArray(schema.enum)) {
        return Sequelize.STRING(255);
      }
      return Sequelize.TEXT;
    }
    if (schema.type === 'integer') {
      return Sequelize.INTEGER;
    }
    if (schema.type === 'number') {
      return Sequelize.DOUBLE;
    }
    if (schema.type === 'boolean') {
      return Sequelize.BOOLEAN;
    }
    if (schema.type === 'object' || schema.type === 'array') {
      return Sequelize.TEXT;
    }
    // Other types are foreign keys.
    return Sequelize.INTEGER;
  }

  async publish(name, definition, models) {
    const fields = {};
    await this.connected;
    Object.keys(definition.properties).forEach(field => {
      let propertySchema = definition.properties[field];
      let type;
      if (propertySchema.$ref) {
        propertySchema = models.get(propertySchema.$ref.substring(14));
        type = Sequelize.STRING(255);
      } else {
        type = this.getType(propertySchema);
      }
      fields[field] = {
        type,
        allowNull: (definition.required || []).indexOf(field) < 0,
        field: snakeCase(field)
      };
    });

    this.databaseModels[name] = this.client.define(name, fields, {
      tableName: snakeCase(name)
    });
    await this.databaseModels[name].sync({force: this.recreate}).catch(err => {
      this.log.error(`Error synchronizing database: ${err.message}`);
    });
  }

  get(name) {
    if (typeof this.databaseModels[name] === 'undefined') {
      throw new TypeError(`Database model not found: ${name}`);
    }
    return this.databaseModels[name];
  }

  async query(sql, replacements) {
    await this.connected;
    return this.client.query(sql, {replacements});
  }

  async startup() {
    this.client = new Sequelize(this.database, {
      define: {
        timestamps: false
      },
      logging: false,
      operatorsAliases: false
    });
    this.client.authenticate().then(() => {
      this.resolveConnected();
      if (this.retryIn) {
        this.log.info('Connected to database');
        this.retryIn = 0;
      }
    }).catch(err => {
      this.log.error('Error connecting to database: ' + err.message);
      ++this.retryIn;
      this.log.info(`Retrying database connection in ${this.retryIn} seconds`);
      setTimeout(() => {
        this.startup();
      }, this.retryIn * 1e3);
    });
    return this.connected;
  }

  async shutdown() {
    await this.client.close();
  }
}

Database.singleton = true;
Database.require = ['Config', 'Log'];

module.exports = Database;
