'use strict';

class QueryError extends Error {
  constructor(errors) {
    const message = errors.map(error => {
      const parts = [];
      ['field', 'message'].forEach(key => {
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
