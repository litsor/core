"use strict";

var mapping = [
  [0, 4],
  [1, 3],
  [2, 5],
  [3, 1],
  [4, 0],
  [5, 2],
  [6, 6],
  [7, 7]
];
var start = 123;
var xor = 63233;
var base = 36;

class Ids {
  constructor(id) {
    if (typeof id === 'string') {
      var input = parseInt(id, base);
      input -= start;
      input ^= xor;
      this.numeric = this.swap(input);
    }
    else {
      this.numeric = id;
    }
  }
  
  swap(input) {
    var output = 0;
    mapping.forEach((pair) => {
      output |= (((15 << (pair[0] * 4)) & input) >> (pair[0] * 4)) << (pair[1] * 4);
    });
    return output;
  }
  
  get id() {
    var output = this.swap(this.numeric);
    output ^= xor;
    output += start;
    return output.toString(base);
  }
}

module.exports = Ids;
