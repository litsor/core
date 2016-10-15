"use strict";

class QueryError extends Error {
  constructor(errors) {
    var message = errors.map((error) => {
      let parts = [];
      ['field', 'message'].forEach((key) => {
        if (typeof error[key] === 'string') {
          parts.push(error[key]);
        }
      });
      return parts.join(' ');
    }).join(', ');
    super('Query error: ' + message);
  }
}

module.exports = QueryError;
