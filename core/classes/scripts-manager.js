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

    const annotations = this.getAnnotations(definition);

    if (annotations.runOnStartup) {
      run();
    }

    if (typeof this.crons[id] !== 'undefined') {
      this.crons[id].stop();
    }
    if (annotations.cron) {
      this.crons[id] = new CronJob({
        cronTime: annotations.cron,
        timezone: annotations.cronTimezone || 'UTC',
        start: true,
        onTick: run
      });
    }
    return script;
  }

  getAnnotations(definition) {
    const annotations = {};
    const lines = definition.split('\n');
    for (let i = 0; i < lines.length; ++i) {
      if (lines[i].trim().length === 0) {
        continue;
      }
      if (lines[i].trim().substring(0, 1) !== '#') {
        break;
      }
      const parts = lines[i].match(/^[\s]*#[\s]*([\w]+)[\s]*=(.+)$/);
      if (!parts) {
        continue;
      }
      try {
        const value = JSON.parse(parts[2].trim());
        annotations[parts[1]] = value;
      } catch (err) {
        // Ignore error.
      }
    }
    return annotations;
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
