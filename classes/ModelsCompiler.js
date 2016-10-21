"use strict";

var fs = require('fs');
var crypto = require('crypto');
var Yaml = require('js-yaml');
var _ = require('lodash');
var isMyJsonValid = require('is-my-json-valid');

class ModelsCompiler {
  constructor() {
    
  }

  generate(inputFile, outputFile) {
    var name = inputFile.match(/\/([^\/]+)\.yml/)[1];
    var schema = Yaml.safeLoad(fs.readFileSync(inputFile));
    
    schema.type = 'object';
    if (!(schema.required instanceof Array)) {
      schema.required = [];
    }
    if (!schema.database) {
      schema.database = 'internal';
    }
    schema.required = _.union(['id'], schema.required);
    
    schema.properties.id = {
      type: 'string',
      format: 'id'
    };
    var disallowAdditionalProps = function(object) {
      if (typeof object.properties === 'object') {
        Object.keys(object.properties).forEach((key) => {
          disallowAdditionalProps(object.properties[key]);
        });
        object.additionalProperties = false;
      }
    };
    disallowAdditionalProps(schema);
    
    var output = '"use strict";';
    
    output += "\n\nexports.name = " + JSON.stringify(name) + ";";
    output += "\n\nexports.database = " + JSON.stringify(schema.database) + ";";
    output += "\n\n" + this.getJsonSchema(schema);
    output += "\n\n" + this.getDefaults(schema);
    output += "\n\n" + this.getAccessMapping(schema);
    output += "\n\n" + this.getValidators(schema);
    output += "\n";
    
    fs.writeFileSync(outputFile, output);
  }

  getSchemaVariant(input, variant) {
    var schema = JSON.parse(JSON.stringify(input));
    var only = null;
    var omit = null;
    switch (variant) {
      case 'input':
        omit = ['id'];
        break;
      case 'key':
        only = ['id'];
        break;
      case 'patch':
        schema.required = ['id'];
        break;
    }
    var properties = Object.keys(schema.properties);
    properties = only ? _.intersection(properties, only) : properties;
    properties = omit ? _.difference(properties, omit) : properties;
    schema.required = _.intersection(schema.required, properties);
    Object.keys(schema.properties).forEach((key) => {
      if (properties.indexOf(key) < 0) {
        delete schema.properties[key];
      }
    });
    return schema;
  }

  getValidators(input) {
    var validators = [];
    ['full', 'input', 'key', 'patch'].forEach((variant) => {
      var options = {
        greedy: true,
        formats: {
          id: '^[\\w]{1,16}$'
        }
      };
      var validator = isMyJsonValid(this.getSchemaVariant(input, variant), options);
      var name = 'validate' + _.capitalize(variant);
      validator = validator
        .toString()
        .split('function validate(data) {')
        .join("exports." + name + " = function(data) {\n  var validate = {};")
        .split('validate.errors = null')
        .join('validate.errors = [];')
        .split('validate.errors.push({field:"data.')
        .join('validate.errors.push({field:"')
        .split('return errors === 0')
        .join("validate.valid = !errors;\n  return validate;") + ';';
      validators.push(validator);
    });
    validators = validators.join("\n\n");
    validators = validators.replace(/format[\d]+/g, 'format1');
    return "var format1 = new RegExp('^[\\\\w]{1,16}$');\n" + validators;
  }
  
  getAccessMapping(input) {
    var functions = {};
    var model = {};
    var output = '';
    var process = function(object, model, access, mutation) {
      if (typeof object.access !== 'string') {
        object.access = access;
      }
      if (typeof object.mutation !== 'string') {
        object.mutation = mutation;
      }
      ['access', 'mutation'].forEach((key) => {
        var name = crypto.createHash('md5').update(object[key]).digest('hex').substring(16);
        functions[name] = object[key];
        model[key] = name;
      });
      if (typeof object.properties === 'object') {
        model.properties = {};
        Object.keys(object.properties).forEach((key) => {
          model.properties[key] = {};
          process(object.properties[key], model.properties[key], object.access, object.mutation);
        });
      }
    };
    process(input, model, 'false', 'false');
    output += "\nvar model = " + JSON.stringify(model, null, 2) + ";";
    output += "\nvar functions = {";
    output += Object.keys(functions).map((key) => {
      let fields = (functions[key] + " ").match(/i\.([\w]+)[^\w]/ig);
      fields = fields === null ? [] : fields.map((match) => {
        return match.match(/i\.([\w]+)[^\w]/i)[1];
      });
      return "\n  '" + key + "': {" +
        "\n    fields: " + JSON.stringify(fields) + "," +
        "\n    'function': function(i,u,q,m) { return " + functions[key] + " }" +
        "\n  }";
    }).join(',');
    output += "\n};";
    output += "\nexports.accessMapping = {model: model, functions: functions};";
    return output;
  }
  
  getDefaults(input) {
    var process = function(object, path, indent) {
      var output = '';
      if (typeof object['default'] !== 'undefined') {
        output += "\n" + indent + "if (typeof " + path + " === 'undefined') {\n  " + indent + path + " = " + object['default'] + ";\n" + indent + "}";
      }
      if (typeof object.properties === 'object') {
        Object.keys(object.properties).forEach((key) => {
          var processField = process(object.properties[key], path + '[' + JSON.stringify(key) + ']', indent + '  ');
          if (processField !== '') {
            output += "\n" + indent + "if (typeof " + path + " === 'object') {";
            output += processField;
            output += "\n" + indent + "}";
          }
        });
      }
      return output;
    };
    return "exports.fillDefaults = function(object) {" + process(input, 'object', '  ') + "\n};";
  }
  
  getJsonSchema(input) {
    var output = {
      type: 'object',
      properties: {},
      required: input.required,
      additionalProperties: false
    };
    // Recursive function to strip properties and set addtionalProperties on objects.
    var process = function(object) {
      ['access', 'mutation', 'default'].forEach((key) => {
        if (typeof object[key] !== 'undefined') {
          delete object[key];
        }
      });
      if (typeof object.properties === 'object') {
        Object.keys(object.properties).forEach((key) => {
          object.properties[key] = process(object.properties[key]);
        });
      }
      return object;
    };
    var output = process(JSON.parse(JSON.stringify(input)));
    output.type = 'object';
    output.additionalProperties = false;
    
    return 'exports.jsonSchema = ' + JSON.stringify(output, null, 2) + ';';
  }
}

module.exports = ModelsCompiler;
