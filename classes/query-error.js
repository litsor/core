'use strict';

class QueryError extends Error {
  constructor(errors) {
    errors = errors.map(error => {
      const parts = [];
      ['field', 'message'].forEach(key => {
        if (typeof error[key] === 'string') {
          parts.push(error[key]);
        }
      });
      return parts.join(' ');
    });
    super('Query error: ' + errors.join(', '));
    this.errors = errors;
  }
}

module.exports = QueryError;
