/* eslint-disable new-cap */
'use strict';

const Sequelize = require('sequelize');
const {snakeCase} = require('lodash');

class Database {
  constructor({Config}) {
    this.database = Config.get('/database', 'sqlite:data/data.db');
    this.recreate = Boolean(Config.get('/recreate-db', false));
    this.client = null;
    this.databaseModels = {};
  }

  getType(schema) {
    if (schema.type === 'string' && typeof schema.maxLength !== 'undefined' && schema.maxLength <= 255) {
      if (schema.maxLength) {
        return Sequelize.STRING(schema.maxLength);
      }
      return Sequelize.STRING;
    }
    if (schema.type === 'string') {
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
    // Other types are foreign keys.
    return Sequelize.INTEGER;
  }

  async publish(name, definition, models) {
    const fields = {};
    Object.keys(definition.properties).forEach(field => {
      let propertySchema = definition.properties[field];
      if (propertySchema.$ref) {
        propertySchema = models.get(propertySchema.$ref.substring(14));
      }
      const type = this.getType(propertySchema);
      fields[field] = {
        type,
        allowNull: (definition.required || []).indexOf(name) >= 0,
        field: snakeCase(field)
      };
    });

    this.databaseModels[name] = this.client.define(name, fields, {
      tableName: snakeCase(name)
    });
    await this.databaseModels[name].sync({force: this.recreate});
  }

  get(name) {
    if (typeof this.databaseModels[name] === 'undefined') {
      throw new TypeError(`Database model not found: ${name}`);
    }
    return this.databaseModels[name];
  }

  async startup() {
    this.client = new Sequelize(this.database, {
      define: {
        timestamps: false
      },
      logging: false,
      operatorsAliases: false
    });
  }

  async shutdown() {
    await this.client.close();
  }
}

Database.singleton = true;
Database.require = ['Config'];

module.exports = Database;
