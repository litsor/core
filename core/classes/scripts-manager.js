'use strict';

const {CronJob} = require('cron');
const ConfigFiles = require('./config-files');

class ScriptsManager extends ConfigFiles {
  constructor(dependencies) {
    super(dependencies);
    this.container = dependencies.Container;
    this.methods = dependencies.Methods;
    this.log = dependencies.Log;

    this.configName = 'scripts';
    this.extension = '.scr';
    this.plain = true;

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

  async validationFunction() {
    return true;
  }

  async create(definition, id) {
    const script = await this.container.get('Script');
    script.setId(id);
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
    const id = script.getId();
    if (typeof this.crons[id] !== 'undefined') {
      // Stop the old cronjob, if any.
      this.crons[id].stop();
    }
  }
}

ScriptsManager.singleton = true;
ScriptsManager.require = ['Methods', 'Container', 'Log', ...ConfigFiles.require];

module.exports = ScriptsManager;
