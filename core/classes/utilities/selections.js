'use strict';

class Selections {
  isComplete(data, selections) {
    return Object.keys(selections || {}).reduce((complete, key) => {
      if (typeof (data || {})[key] === 'undefined') {
        // Check if we're dealing with an array of items and process them individually.
        if (Array.isArray(data)) {
          return complete && data.reduce((subComplete, item) => {
            return subComplete && this.isComplete(item, selections);
          }, true);
        }

        return false;
      }
      if (Object.keys(selections[key]).length > 0) {
        return complete && this.isComplete(data[key], selections[key]);
      }
      return complete;
    }, true);
  }
}

Selections.singleton = true;
Selections.require = [];

module.exports = Selections;
