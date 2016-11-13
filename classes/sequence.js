'use strict';

const redis = require('redis');

const Ids = require('./ids');

class Sequence {
  constructor(name, database) {
    this.name = name;
    this.lastId = 0;
    this.client = redis.createClient(database.port, database.host);
  }

  get() {
    return new Promise((resolve, reject) => {
      this.client.hincrby('ids', this.name, 1, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(new Ids(result).id);
        }
      });
    });
  }
}

module.exports = Sequence;
