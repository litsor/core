'use strict';

const {get} = require('jsonpointer');

class Input {
  get(data, input) {
    const output = {};
    Object.keys(input).filter(value => !value.startsWith('_')).forEach(key => {
      const source = input[key];
      if (typeof source === 'string' && source.startsWith('/')) {
        // The input is a path. Get the value via JSONPointer.
        try {
          output[key] = get(data, source === '/' ? '' : source);
        } catch (e) {
          output[key] = null;
        }
      } else if (typeof source === 'object' && Object.keys(source).length === 1 && typeof source['='] !== 'undefined') {
        // There is a special syntax to allow static strings starting with a slash. In YAML we write:
        // {=: /oauth}
        output[key] = source['='];
      } else {
        // The input is a static value.
        output[key] = source;
      }
    });
    return output;
  }
}

Input.singleton = true;
Input.require = [];

module.exports = Input;
