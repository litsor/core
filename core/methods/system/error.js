'use strict';

const createError = require('http-errors');

module.exports = {
  title: 'Error',
  description: 'Break the script with an error',

  inputSchema: {
    type: 'object',
    properties: {
      message: {
        title: 'Error message',
        type: 'string'
      },
      type: {
        title: 'Error code',
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

  defaults: {
    code: 'InternalServerError',
    _output: null
  },

  unary: ({type, message}) => {
    throw new createError[type](message);
  }
};
