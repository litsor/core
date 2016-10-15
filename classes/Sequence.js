"use strict";

var redis = require('redis');
var redisClient = redis.createClient(6379, 'localhost');
var Ids = require('./Ids');

class Sequence {
  constructor(name) {
    this.name = name;
    this.lastId = 0;
    this.ready = new Promise((resolve, reject) => {
      this.lastId = 0;
      resolve();
    });
  }
  
  get() {
    return new Promise((resolve, reject) => {
      redisClient.hincrby('ids', this.name, 1, function(error, result) {
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
