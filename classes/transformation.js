'use strict';

const Crypto = require('crypto');

const _ = require('lodash');
const JsonPath = require('jsonpath');

class Transformation {
  constructor(template) {
    this._template = template;
  }

  transform(value) {
    if (value === null || typeof value === 'undefined') {
      return null;
    }
    let output = _.cloneDeep(value);
    const keys = Object.keys(this._template);
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      if (typeof this[`_${key}`] !== 'function') {
        throw new Error(`Unknown function ${key}`);
      }
      output = this[`_${key}`](output, this._template[key]);
      if (output === null || typeof output === 'undefined') {
        // Bails when missing output in chain. For example when
        // executing single: '$.unknown' followed by substring.
        return null;
      }
    }
    return output;
  }

  _single(value, options) {
    if (typeof options !== 'string') {
      throw new Error('Value of "single" function must be a string');
    }
    // Performance: skip query parsing if query refers to a simple property.
    const match = options.match(/^\$\.([\w]+)$/);
    if (match) {
      return typeof value[match[1]] === 'undefined' ? null : value[match[1]];
    }
    const result = JsonPath.query(value, options);
    return result.length ? result[0] : null;
  }

  _multiple(value, options) {
    if (typeof options !== 'string') {
      throw new Error('Value of "multiple" functions must be a string');
    }
    return JsonPath.query(value, options);
  }

  _static(value, options) {
    return options;
  }

  _object(value, options) {
    if (typeof options !== 'object') {
      throw new Error('Value of "object" functions must be an object');
    }
    const output = {};
    Object.keys(options).forEach(key => {
      const template = typeof options[key] === 'string' ? {single: options[key]} : options[key];
      const transformer = new Transformation(template);
      output[key] = transformer.transform(value);
    });
    return output;
  }

  _map(value, options) {
    if (!(value instanceof Array)) {
      return null;
    }
    const output = [];
    value.forEach(item => {
      const template = typeof options === 'string' ? {single: options} : options;
      const transformer = new Transformation(template);
      output.push(transformer.transform(item));
    });
    return output;
  }

  _substring(value, options) {
    if (typeof value !== 'string') {
      throw new Error('Cannot execute substring on ' + (typeof value));
    }
    const start = typeof options.start === 'number' ? options.start : 0;
    const length = typeof options.length === 'number' ? options.length : Infinity;
    return value.substring(start, start + length);
  }

  _length(value) {
    if (typeof value !== 'string' && !(value instanceof Array)) {
      throw new Error('Can only get length of arrays and strings');
    }
    return value.length;
  }

  _hash(value, options) {
    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }
    options = _.defaults(options, {
      encoding: 'hex',
      algorithm: 'md5'
    });
    return Crypto.createHash(options.algorithm).update(value).digest(options.encoding);
  }

  _array(value, options) {
    if (!(options instanceof Array)) {
      throw new Error('Options for array transformation must be an array');
    }
    return options.map(item => {
      const transformer = new Transformation(typeof item === 'string' ? {single: item} : item);
      return transformer.transform(value);
    });
  }

  _join(value, options) {
    if (!(value instanceof Array)) {
      throw new Error('Value for join transformation must be an array');
    }
    const separator = options.separator ? options.separator : '';
    return value.join(separator);
  }

  _split(value, options) {
    if (!options.separator) {
      throw new Error('Missing separator for split transformation');
    }
    if (typeof value !== 'string') {
      return [];
    }
    return value.split(options.separator);
  }

  _filter(value) {
    if (!(value instanceof Array)) {
      throw new Error('Value for filter transformation must be an array');
    }
    return value.filter(item => item);
  }
}

module.exports = Transformation;
