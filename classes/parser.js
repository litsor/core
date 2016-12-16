'use strict';

const _graphqlLanguage = require('graphql/language');

const extractValue = function(value, variables) {
  let output = null;
  if (value.kind === 'Variable') {
    const name = value.name.value;
    if (typeof variables !== 'object' || typeof variables[name] === 'undefined') {
      variables[name] = null;
    }
    return variables[name];
  }
  if (value.kind === 'ObjectValue') {
    output = {};
    value.fields.forEach(field => {
      const name = field.name.value;
      const value = extractValue(field.value);
      output[name] = value;
    });
  } else if (value.kind === 'ListValue') {
    output = [];
    value.values.forEach(item => {
      output.push(extractValue(item));
    });
  } else if (value.kind === 'StringValue') {
    output = value.value;
  } else if (value.kind === 'IntValue') {
    output = parseInt(value.value, 10);
  } else if (value.kind === 'FloatValue') {
    output = parseFloat(value.value);
  } else if (value.kind === 'BooleanValue') {
    output = Boolean(value.value);
  }
  return output;
};

const convert = function(definition, variables) {
  const output = {};
  if (!definition.selectionSet) {
    return output;
  }
  definition.selectionSet.selections.forEach(field => {
    const name = field.name.value;
    const alias = field.alias ? field.alias.value : name;
    const params = {};
    field.arguments.forEach(param => {
      const name = param.name.value;
      const value = extractValue(param.value, variables);
      params[name] = value;
    });
    output[alias] = {name, params};
    const fieldNames = {};
    if (typeof field.selectionSet !== 'undefined') {
      output[alias].fields = convert(field, variables);
      Object.keys(output[alias].fields).forEach(field => {
        fieldNames[output[alias].fields[field].name] = true;
      });
    }
    output[alias].fieldNames = Object.keys(fieldNames);
  });
  return output;
};

module.exports = function(query, variables) {
  const parsed = (0, _graphqlLanguage.parse)(query);
  return convert(parsed.definitions[0], variables);
};
