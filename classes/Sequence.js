"use strict";

const redis = require('redis');
const Ids = require('./Ids');

class Sequence {
  constructor(name, database) {
    this.name = name;
    this.lastId = 0;
    
    this.client = redis.createClient(database.port, database.host);
    
    this.ready = new Promise((resolve, reject) => {
      this.lastId = 0;
      resolve();
    });
  }
  
  get() {
    let self = this;
    return new Promise((resolve, reject) => {
      self.client.hincrby('ids', this.name, 1, function(error, result) {
        if (error) {
          reject(error);
        }
        else {
          resolve(new Ids(result).id);
        }
      });
    });
  }
}

module.exports = Sequence;
