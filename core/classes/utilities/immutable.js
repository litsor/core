'use strict';

const {fromJS, isImmutable, isKeyed, isIndexed} = require('immutable');

class Immutable {
  fromJS(data) {
    return fromJS(data);
  }

  isImmutable(data) {
    return isImmutable(data);
  }

  isKeyed(data) {
    return isKeyed(data);
  }

  isIndexed(data) {
    return isIndexed(data);
  }
}

Immutable.singleton = true;
Immutable.require = [];

module.exports = Immutable;
