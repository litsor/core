'use strict';

const Crypto = require('crypto');

const _ = require('lodash');
const $ = require('cheerio');
const JsonPointer = require('jsonpointer');
const Schedule = require('node-schedule');
const Bluebird = require('bluebird');
const XmlToJson = Bluebird.promisifyAll(require('xml2js'));
const fetch = require('node-fetch');
const isMyJsonValid = require('is-my-json-valid');

class Script {
  /**
   * Initialize script.
   *
   * @param object definition
   *   Script definition.
   * @param Storage storage
   *   Storage.
   * @param object options
   *   Script options.
   */
  constructor(definition, storage, options) {
    if (typeof definition.name !== 'string') {
      throw new Error('Missing name for script');
    }
    if (!(definition.steps instanceof Array)) {
      throw new Error('Missing steps for script');
    }
    this.definition = _.defaults(definition, {
      maxSteps: 1000,
      delay: 0,
      runOnStartup: false
    });
    this.options = _.defaults(options, {
      debug: false
    });
    this.storage = storage;

    this.running = false;
    this.step = 0;
    this.executedSteps = 0;

    if (typeof definition.schedule === 'string') {
      this.scheduledJob = Schedule.scheduleJob(definition.schedule, () => {
        if (!this.running) {
          this.run({});
        }
      });
      // @todo: Call this.scheduledJob.cancel() when stopping application.
    }

    if (this.definition.runOnStartup) {
      setTimeout(() => {
        this.run().catch(err => {
          console.error(err);
        });
      }, 2000);
    }
  }

  clone() {
    return new Script(this.definition, this.storage, this.options);
  }

  setDebug(value) {
    this.options.debug = value;
    return this;
  }

  run(input) {
    if (this.running) {
      throw new Error('Script is already running');
    }
    this.running = true;
    this.data = input || {};
    this.step = 0;
    if (this.options.debug) {
      this.debugData = [];
    }
    return this.executeStep().then(() => {
      this.running = false;
      if (this.options.debug) {
        return {
          definition: this.definition.steps,
          children: this.debugData,
          output: this.data
        };
      }
      return this.data;
    }).catch(err => {
      this.running = false;
      throw err;
    });
  }

  executeStep() {
    const step = this.definition.steps[this.step];
    ++this.step;
    if (typeof step === 'undefined') {
      return Promise.resolve();
    }

    if (++this.executedSteps >= this.definition.maxSteps) {
      throw new Error('Maximum executed steps reached');
    }

    if (typeof step === 'string') {
      // It's a label. Proceed with the next step.
      return this.executeStep();
    }

    const keys = Object.keys(step);
    if (keys.length !== 1) {
      throw new Error('Each step must have exactly one key that define the action');
    }
    const action = keys[0];
    this.lastAction = action;

    if (typeof this['_' + action] !== 'function') {
      throw new Error('Unknown function ' + action + ' in script');
    }

    let originalPointer;
    let debugData;
    if (this.options.debug) {
      originalPointer = this.debugPointer ? this.debugPointer : this.debugData;
      debugData = {
        definition: step,
        children: []
      };
      this.debugPointer = debugData.children;
    }

    return Promise.resolve(this['_' + action](this.data, step[action])).then(output => {
      if (this.options.debug) {
        debugData.output = JSON.parse(JSON.stringify(output));
        this.debugPointer = originalPointer;
        this.debugPointer.push(debugData);
      }

      this.data = output;
      if (this.definition.delay) {
        // Prevent calling Bluebird.delay(0), as it still has a few ms delay.
        return Bluebird.delay(this.definition.delay);
      }
    }).then(() => {
      return this.executeStep();
    });
  }

  shorthand(input, value, sourceName) {
    if (typeof value === 'string') {
      if (value.match(/^\//)) {
        sourceName = `${sourceName}, using shorthand`;
        value = [{get: value}];
      }
    }
    if (!(value instanceof Array)) {
      return Promise.resolve(value);
    }
    const script = new Script({
      name: this.name + ':' + this.lastAction,
      steps: value
    }, this.storage, this.options);
    return script.run(_.cloneDeep(input)).then(result => {
      if (this.options.debug) {
        result.info = sourceName;
        this.debugPointer.push(result);
        return result.output;
      }
      return result;
    });
  }

  _config(value, options) {
    if (typeof options !== 'string') {
      throw new Error('Value for "config" method must be a string');
    }
    if (!options.match(/^\/storage\//)) {
      throw new Error('Only config inside /storage is accessible');
    }
    const config = {
      storage: this.storage.options
    };
    return JsonPointer.get(config, options);
  }

  _request(value, options) {
    // Allows writing "- request: 'url'" for simple GET requests.
    if (typeof options === 'string') {
      options = {
        url: options
      };
    }

    options = _.defaults(options, {
      headers: {},
      method: 'GET',
      format: 'auto'
    });

    const getCookies = (res, initialCookies) => {
      const cookies = _.clone(initialCookies || {});
      res.headers.getAll('set-cookie').forEach(header => {
        const match = header.match(/^([^=]+)=([^;]*)/);
        if (match) {
          const name = match[1];
          const value = match[2];
          if (value) {
            cookies[name] = value;
          } else if (typeof cookies[name] !== 'undefined') {
            delete cookies[name];
          }
        }
      });
      return cookies;
    };

    const getCookieHeader = cookies => {
      const output = [];
      Object.keys(cookies).forEach(name => {
        output.push(name + '=' + cookies[name]);
      });
      return output.join('; ');
    };

    const script = new Script({
      name: `${this.name}:request`,
      steps: [{
        object: options
      }]
    }, this.storage);
    return script.run(value).then(options => {
      let response;
      const cookies = options.cookies || {};
      if (typeof cookies === 'object' && Object.keys(cookies).length > 0) {
        options.headers.Cookie = getCookieHeader(cookies);
      }
      return fetch(options.url, {
        method: options.method,
        headers: options.headers,
        body: options.body
      }).then(_response => {
        response = _response;
        if (response.statusCode >= 300) {
          throw new Error('Retrieved error code from remote server: ' + response.statusCode);
        }
        if (options.format === 'json' || (options.format === 'auto' && response.headers.get('content-type').match(/^application\/json/))) {
          return response.json();
        }
        if (options.format === 'xml' || (options.format === 'auto' && response.headers.get('content-type').match(/^text\/xml/))) {
          return response.text().then(text => {
            return XmlToJson.parseStringAsync(text);
          });
        }
        return response.text();
      }).then(body => {
        const result = {
          body,
          headers: response.headers.raw(),
          cookies: getCookies(response, cookies)
        };
        const resultProperty = typeof options.resultProperty === 'string' ? options.resultProperty : '/result';
        if (resultProperty === '') {
          return result;
        }
        JsonPointer.set(value, resultProperty, result);
        return value;
      }).catch(err => {
        console.error(err);
        throw new Error(`Unable to connect to "${options.url}"`);
      });
    });
  }

  _query(value, options) {
    // Allows writing "- query: '...'" for queries without arguments.
    if (typeof options === 'string') {
      options = {query: options};
    }
    options = _.defaults(options, {
      arguments: {}
    });
    return this.shorthand(value, [{object: options.arguments}], 'query arguments').then(args => {
      return this.storage.query(options.query, args);
    }).then(result => {
      const resultProperty = typeof options.resultProperty === 'string' ? options.resultProperty : '/result';
      if (resultProperty === '') {
        return result;
      }
      JsonPointer.set(value, resultProperty, result);
      return value;
    });
  }

  _jump(value, options) {
    options = typeof options === 'string' ? {to: options} : _.clone(options);
    const jump = _.defaults(_.clone(options) || {}, {
      left: true,
      right: true,
      operator: '=='
    });
    return Promise.all([
      this.shorthand(value, jump.left, 'left operand'),
      this.shorthand(value, jump.right, 'right operand')
    ]).then(values => {
      jump.left = values[0];
      jump.right = values[1];
      let match;
      switch (jump.operator) {
        case '==':
          match = String(jump.left) === String(jump.right);
          break;
        case '===':
          match = jump.left === jump.right;
          break;
        case '!=':
          match = String(jump.left) !== String(jump.right);
          break;
        case '!==':
          match = jump.left !== jump.right;
          break;
        case '<':
          match = jump.left < jump.right;
          break;
        case '>':
          match = jump.left > jump.right;
          break;
        case '<=':
          match = jump.left <= jump.right;
          break;
        case '>=':
          match = jump.left >= jump.right;
          break;
        case 'in':
          match = jump.right instanceof Array ? jump.right.indexOf(jump.left) >= 0 : false;
          break;
        default:
          match = false;
      }
      if (match) {
        for (let i = 0; i < this.definition.steps.length; ++i) {
          if (this.definition.steps[i] === jump.to) {
            this.step = i;
          }
        }
      }
      return value;
    });
  }

  _increment(value, options) {
    let counter = JsonPointer.get(value, options);
    counter = typeof counter === 'number' ? counter + 1 : 0;
    JsonPointer.set(value, options, counter);
    return value;
  }

  _get(value, options) {
    if (typeof options !== 'string') {
      throw new Error('Value of "get" function must be a string');
    }
    try {
      const result = JsonPointer.get(value, options);
      return typeof result === 'undefined' ? null : result;
    } catch (err) {
      // JsonPointer throws an exception when trying to get a property on null,
      // for example "/a/b" on {a: null}. This is inconsistent with the behavior
      // to return null for "/a/b" on {a: {}}. Catch the exception and return
      // null for all error cases.
      return null;
    }
  }

  _static(value, options) {
    return options;
  }

  _object(value, options) {
    if (typeof options !== 'object') {
      throw new Error('Value of "object" functions must be an object');
    }
    let output = {};
    let retainData = false;
    return Promise.all(Object.keys(options).map(key => {
      if (key === '...') {
        retainData = true;
        return null;
      }
      return this.shorthand(value, options[key], `${key} property`).then(result => {
        output[key] = result;
      });
    })).then(() => {
      if (retainData && typeof value === 'object' && value !== null) {
        output = _.defaults(output, value);
      }
      return output;
    });
  }

  _map(value, options) {
    if (!(value instanceof Array)) {
      return null;
    }
    return Bluebird.resolve(value).map(item => {
      return this.shorthand(item, options, 'array item');
    });
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
    return Bluebird.resolve(options).map(item => {
      return this.shorthand(value, item, 'array item');
    });
  }

  _union(value, options) {
    if (!(options instanceof Array)) {
      throw new Error('Options for union transformation must be an array');
    }
    return this._array(value, options).map(chunk => {
      if (chunk === null) {
        return [];
      }
      return chunk instanceof Array ? chunk : this.shorthand(value, [chunk], 'array');
    }).then(chunks => {
      return _.union.apply(_, chunks);
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

  _slice(value, options) {
    if (!(value instanceof Array)) {
      throw new Error('Value for slice transformation must be an array');
    }
    options = _.defaults(options, {
      from: 0,
      to: Infinity
    });
    return value.slice(options.from, options.to);
  }

  _count(value) {
    if (typeof value !== 'string' && !(value instanceof Array)) {
      return 0;
    }
    return value.length;
  }

  _case(value, options) {
    if (typeof options !== 'object' || options === null) {
      throw new Error('Value of "case" functions must be an object');
    }
    const operand = String(value);
    if (typeof options[operand] !== 'undefined') {
      return options[operand];
    }
    if (typeof options.default !== 'undefined') {
      return options.default;
    }
    return null;
  }

  _htmlTag(value, options) {
    if (typeof options !== 'string') {
      throw new Error('Value of "htmlTag" functions must be a string');
    }
    if (typeof value === 'string') {
      const result = $(options, value);
      if (result.length > 0) {
        return $(result[0]).toString();
      }
    }
    return null;
  }

  _htmlTags(value, options) {
    if (typeof options !== 'string') {
      throw new Error('Value of "htmlTags" functions must be a string');
    }
    const output = [];
    if (typeof value === 'string') {
      const result = $(options, value);
      for (let i = 0; i < result.length; ++i) {
        output.push($(result[i]).toString());
      }
    }
    return output;
  }

  _htmlTagText(value, options) {
    if (typeof options !== 'string') {
      throw new Error('Value of "htmlTagText" functions must be a string');
    }
    if (typeof value === 'string') {
      const result = $(options, value);
      if (result.length > 0) {
        return $(result[0]).text();
      }
    }
    return null;
  }

  _htmlTagsText(value, options) {
    if (typeof options !== 'string') {
      throw new Error('Value of "htmlTagsText" functions must be a string');
    }
    const output = [];
    if (typeof value === 'string') {
      const result = $(options, value);
      for (let i = 0; i < result.length; ++i) {
        output.push($(result[i]).text());
      }
    }
    return output;
  }

  _htmlAttribute(value, options) {
    if (typeof options !== 'string') {
      throw new Error('Value of "htmlAttribute" functions must be a string');
    }
    if (typeof value === 'string') {
      const result = $(value).attr(options);
      return typeof result === 'undefined' ? null : result;
    }
    return null;
  }

  _htmlTable(value, options) {
    if (typeof options !== 'object' || typeof options.cell !== 'number' || typeof options.text !== 'string') {
      throw new Error('Value of "htmlTable" functions must be an object with cell and text properties');
    }
    if (typeof value === 'string') {
      const selector = typeof options.selector === 'string' ? `${options.selector}>tr ${options.selector}>tbody>tr` : 'tr';
      const rows = $(selector, value);
      for (let i = 0; i < rows.length; ++i) {
        const cells = $('td', rows[i]);
        if (cells.length >= options.cell && $(cells[options.cell]).text().trim().toLowerCase() === options.text.trim().toLowerCase()) {
          if (typeof options.returnCell === 'number') {
            const cells = $('td', rows[i]);
            return cells.length >= options.returnCell ? $(cells[options.returnCell]).text() : null;
          }
          return $(rows[i]).toString();
        }
      }
    }
    return null;
  }

  _replace(value, options) {
    if (typeof options !== 'object' || typeof options.search !== 'string' || typeof options.replace !== 'string') {
      throw new Error('Value of "replace" functions must be an object with search and replace properties');
    }
    if (typeof value === 'string') {
      let search = options.search;
      const match = search.match(/^\/(.+)\/([img]*)$/);
      if (match) {
        search = new RegExp(match[1], match[2]);
      }
      return value.replace(search, options.replace);
    }
    return null;
  }

  _fromJson(value) {
    return JSON.parse(value);
  }

  _toJson(value) {
    return JSON.stringify(value);
  }

  _fromXml(value) {
    if (typeof value !== 'string') {
      return null;
    }
    return XmlToJson.parseStringAsync(value);
  }

  _now() {
    return ~~(new Date() / 1e3);
  }

  _lowerCase(value) {
    if (typeof value !== 'string') {
      return null;
    }
    return _.lowerCase(value);
  }

  _upperCase(value) {
    if (typeof value !== 'string') {
      return null;
    }
    return _.upperCase(value);
  }

  _camelCase(value) {
    if (typeof value !== 'string') {
      return null;
    }
    return _.camelCase(value);
  }

  _kebabCase(value) {
    if (typeof value !== 'string') {
      return null;
    }
    return _.kebabCase(value);
  }

  _snakeCase(value) {
    if (typeof value !== 'string') {
      return null;
    }
    return _.snakeCase(value);
  }

  _nameCase(value) {
    if (typeof value !== 'string') {
      return null;
    }
    return value.toLowerCase().split(/[\s]/).map(word => {
      return word.substring(0, 1).toUpperCase() + word.substring(1);
    }).join(' ');
  }

  _capitalize(value) {
    if (typeof value !== 'string') {
      return null;
    }
    return _.capitalize(value);
  }

  _deburr(value) {
    if (typeof value !== 'string') {
      return null;
    }
    return _.deburr(value);
  }

  _assert(value, options) {
    const schema = {
      type: 'object',
      properties: options
    };
    if (!isMyJsonValid(schema)(value)) {
      throw new Error('Assertion did not pass: ' + JSON.stringify(value));
    }
    return value;
  }

  _keys(value) {
    if (typeof value !== 'object' || value === null) {
      return [];
    }
    return Object.keys(value);
  }

  _changed(value, options) {
    if (!options.left || !options.right) {
      throw new Error('Changed requires left and right properties');
    }
    return Promise.all([
      this.shorthand(value, options.left, 'left'),
      this.shorthand(value, options.right, 'right')
    ]).then(sides => {
      let [left, right] = sides;
      left = typeof left === 'object' && left !== null ? left : {};
      right = typeof right === 'object' && right !== null ? right : {};
      const output = {};
      const keysLeft = Object.keys(left);
      const keysRight = Object.keys(right);
      // Removed keys.
      _.difference(keysLeft, keysRight).forEach(key => {
        if (left[key] !== null) {
          output[key] = null;
        }
      });
      // Added keys.
      _.difference(keysRight, keysLeft).forEach(key => {
        if (right[key] !== null) {
          output[key] = right[key];
        }
      });
      // Changed keys.
      _.intersection(keysLeft, keysRight).forEach(key => {
        if (JSON.stringify(left[key]) !== JSON.stringify(right[key])) {
          output[key] = right[key];
        }
      });
      return output;
    });
  }

  _change(value, options) {
    if (!options.target || !options.changes) {
      throw new Error('Change requires target and changes properties');
    }
    return Promise.all([
      this.shorthand(value, options.target, 'target'),
      this.shorthand(value, options.changes, 'changes')
    ]).then(sides => {
      let [target, changes] = sides;
      target = typeof target === 'object' && target !== null ? target : {};
      changes = typeof changes === 'object' && changes !== null ? changes : {};
      const output = JSON.parse(JSON.stringify(target));
      Object.keys(changes).forEach(key => {
        if (changes[key] === null) {
          delete output[key];
        } else {
          output[key] = changes[key];
        }
      });
      return output;
    });
  }
}

module.exports = Script;
