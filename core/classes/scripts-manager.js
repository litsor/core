'use strict';

const {CronJob} = require('cron');
const createValidator = require('is-my-json-valid');
const ConfigFiles = require('./config-files');

class ScriptsManager extends ConfigFiles {
  constructor(dependencies) {
    super(dependencies);
    this.container = dependencies.Container;
    this.methods = dependencies.Methods;
    this.log = dependencies.Log;

    this.configName = 'scripts';

    this.validationSchema = {
      type: 'object',
      properties: {
        id: {
          type: 'string'
        },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            minProperties: 1,
            maxProperties: 1
          }
        },
        runOnStartup: {
          type: 'boolean'
        },
        cron: {
          type: 'string'
        },
        cronTimezone: {
          type: 'string'
        }
      },
      required: ['id', 'steps'],
      additionalProperties: true
    };

    this.crons = {};
  }

  async validationFunction(input) {
    const basicValidation = await super.validationFunction(input);
    if (basicValidation !== true) {
      return basicValidation;
    }

    try {
      const promises = input.steps.map(async step => {
        const methodName = Object.keys(step)[0];
        const method = await this.methods.get(methodName);
        const {_output, _comment, ...stepConfig} = step[methodName];
        if (typeof _output !== 'undefined' && typeof _output !== 'string' && _output !== null) {
          throw new TypeError(`Value for _output in "${methodName}" must be a string or null`);
        }
        if (typeof _comment !== 'undefined' && typeof _comment !== 'string') {
          throw new TypeError(`Value for _comment in "${methodName}" must be a string`);
        }

        Object.keys(stepConfig).forEach(propName => {
          let propConfig = stepConfig[propName];
          const propSchema = method.inputSchema.properties[propName] || method.inputSchema.additionalProperties;
          if (propSchema === true) {
            // All types allowed by additional properties.
            return;
          }
          if (!propSchema) {
            throw new TypeError(`Unknown property "${propName}" in config for "${methodName}"`);
          }
          if (typeof propConfig === 'string' && propConfig.startsWith('/')) {
            return;
          }
          if (typeof propConfig === 'object' && propConfig !== null && Object.keys(propConfig).length === 1 && Object.keys(propConfig)[0] === '=') {
            propConfig = propConfig['='];
          }
          const validator = createValidator(propSchema);
          if (!validator(stepConfig[propName])) {
            const errors = validator.errors.map(({field, message}) => `${field.substring(5)} ${message}`).join(', ');
            throw new TypeError(`Invalid property "${propName}" in "${methodName}": ${errors}`);
          }
        });

        (method.inputSchema.required || []).forEach(propName => {
          if (typeof stepConfig[propName] === 'undefined') {
            throw new TypeError(`Missing "${propName}" in config for "${methodName}"`);
          }
        });
      });
      await Promise.all(promises);
    } catch (err) {
      return err.message;
    }

    return true;
  }

  async create(definition) {
    const script = await this.container.get('Script');
    script.load(definition);
    const run = async () => {
      const correlationId = this.log.generateCorrelationId();
      try {
        await script.run({}, {correlationId});
      } catch (err) {
        this.log.log({
          severity: 'error',
          message: err.message,
          correlationId,
          ...(err.properties || {})
        });
      }
    };
    if (definition.runOnStartup) {
      run();
    }
    if (definition.cron) {
      this.crons[definition.id] = new CronJob({
        cronTime: definition.cron,
        timezone: definition.cronTimezone || 'UTC',
        start: true,
        onTick: run
      });
    }
    return script;
  }

  async destroy(script) {
    const {id} = script.getDefinition();
    if (typeof this.crons[id] !== 'undefined') {
      // Stop the old cronjob, if any.
      this.crons[id].stop();
    }
  }
}

ScriptsManager.singleton = true;
ScriptsManager.require = ['Methods', 'Container', 'Log', ...ConfigFiles.require];

module.exports = ScriptsManager;
