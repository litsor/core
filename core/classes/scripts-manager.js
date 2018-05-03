'use strict';

const {CronJob} = require('cron');
const ConfigFiles = require('./config-files');

class ScriptsManager extends ConfigFiles {
  constructor(dependencies) {
    super(dependencies);
    this.container = dependencies.Container;
    this.configName = 'scripts';
    this.crons = {};
  }

  async create(definition) {
    const script = await this.container.get('Script');
    script.load(definition);
    const run = async () => {
      try {
        await script.run({});
      } catch (err) {
        console.log(err);
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

  publish() {
    const recommended = [
      'Create',
      'Read',
      'Update',
      'Delete',
      'Select'
    ];
    const missing = recommended.reduce((prev, item) => {
      return typeof this.items[item] === 'undefined' ? [item, ...prev] : prev;
    }, []);
    if (missing.length > 0) {
      console.log('Warning: The following scripts are missing: ' + missing.join(', '));
    }
  }
}

ScriptsManager.singleton = true;
ScriptsManager.require = ['Container', ...ConfigFiles.require];

module.exports = ScriptsManager;
