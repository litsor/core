'use strict';

const createError = require('http-errors');

module.exports = {
  name: 'Error',
  description: 'Break the script with an error',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      message: {
        name: 'Error message',
        type: 'string'
      },
      type: {
        name: 'Error code',
        type: 'string',
        enum: [
          'BadRequest',
          'Unauthorized',
          'PaymentRequired',
          'Forbidden',
          'NotFound',
          'MethodNotAllowed',
          'NotAcceptable',
          'ProxyAuthenticationRequired',
          'RequestTimeout',
          'Conflict',
          'Gone',
          'LengthRequired',
          'PreconditionFailed',
          'PayloadTooLarge',
          'URITooLong',
          'UnsupportedMediaType',
          'RangeNotSatisfiable',
          'ExpectationFailed',
          'ImATeapot',
          'MisdirectedRequest',
          'UnprocessableEntity',
          'Locked',
          'FailedDependency',
          'UnorderedCollection',
          'UpgradeRequired',
          'PreconditionRequired',
          'TooManyRequests',
          'RequestHeaderFieldsTooLarge',
          'UnavailableForLegalReasons',
          'InternalServerError',
          'NotImplemented',
          'BadGateway',
          'ServiceUnavailable',
          'GatewayTimeout',
          'HTTPVersionNotSupported',
          'VariantAlsoNegotiates',
          'InsufficientStorage',
          'LoopDetected',
          'BandwidthLimitExceeded',
          'NotExtended',
          'NetworkAuthenticationRequired'
        ]
      }
    },
    additionalProperties: false
  },

  outputSchema: () => {
    return {};
  },

  defaults: {
    code: 'InternalServerError',
    _output: null
  },

  requires: [],

  tests: [],

  execute: ({type, message}) => {
    throw new createError[type](message);
  }
};
