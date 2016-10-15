"use strict";

const _graphqlLanguage = require('graphql/language');

var extractValue = function(value) {
  var output = null;
  if (value.kind === 'ObjectValue') {
    output = {};
    value.fields.forEach((field) => {
      let name = field.name.value;
      let value = extractValue(field.value);
      output[name] = value;
    });
  }
  else if (value.kind === 'ListValue') {
    output = [];
    value.values.forEach((item) => {
      output.push(extractValue(item));
    });
  }
  else if (value.kind === 'StringValue') {
    output = value.value;
  }
  else if (value.kind === 'IntValue') {
    output = parseInt(value.value);
  }
  else if (value.kind === 'FloatValue') {
    output = parseFloat(value.value);
  }
  return output;
};

var convert = function(definition) {
  var output = {};
  if (!definition.selectionSet) {
    return output;
  }
  definition.selectionSet.selections.forEach((field) => {
    let name = field.name.value;
    let alias = field.alias ? field.alias.value : name;
    let params = {};
    field.arguments.forEach((param) => {
      let name = param.name.value;
      let value = extractValue(param.value);
      params[name] = value;
    });
    output[alias] = {
      name: name,
      params: params
    };
    var fieldNames = {};
    if (typeof field.selectionSet !== 'undefined') {
      output[alias].fields = convert(field);
      for (field in output[alias].fields) {
        fieldNames[output[alias].fields[field].name] = true;
      }
    }
    output[alias].fieldNames = Object.keys(fieldNames);
  });
  return output;
};

module.exports = function(query) {
  var parsed = (0, _graphqlLanguage.parse)(query);
  return convert(parsed.definitions[0]);
};
