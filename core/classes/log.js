'use strict';

const fs = require('fs');
const {promisify} = require('util');
const {resolve} = require('path');
const {randomBytes} = require('crypto');
const moment = require('moment');
const chalk = require('chalk');

const open = promisify(fs.open);
const close = promisify(fs.close);
const write = promisify(fs.write);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);

class Log {
  constructor({Config}) {
    this.dir = Config.get('/logDir', 'data/logs');
    this.writeInterval = parseInt(Config.get('/logWriteInterval', '5'), 10);
    this.logTo = Config.get('/logTo', 'file,console').split(',');
    this.maxBufferSize = parseInt(Config.get('/maxBufferSize', '10485760'), 10);

    this.writing = false;
    this.bufferSize = 0;
    this.buffer = [];
  }

  async startup() {
    // Try to create the log directory if it does not already exist.
    try {
      await stat(this.dir);
    } catch (err) {
      if (err.code === 'ENOENT') {
        try {
          await mkdir(this.dir);
        } catch (err) {
          console.error(err);
        }
      } else {
        console.error(err);
      }
    }

    // Setup the background process for writing to the logfile.
    this.interval = setInterval(() => {
      if (this.bufferSize) {
        this.flush();
      }
    }, this.writeInterval * 1e3);
  }

  async shutdown() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  async _flush() {
    const date = moment().format('YYYYMMDD');
    const fd = await open(resolve(this.dir, `${date}.ndjson`), 'a');
    await write(fd, this.buffer.join('\n') + '\n');
    await close(fd);
    this.buffer = [];
    this.bufferSize = 0;
  }

  async flush() {
    if (!this.writing) {
      this.writing = true;
      try {
        await this._flush();
      } catch (err) {
        console.error('Error writing logs: ' + err.message);
      }
      this.writing = false;
    }
  }

  writeToConsole({severity, correlationId, message, timestamp, ...properties}) {
    const date = moment(timestamp).format('HH:mm:ss');
    const propsString = ' ' + chalk.dim(Object.keys(properties).map(name => `${name}: ${properties[name]}`).join(', '));
    switch (severity) {
      case 'info':
        console.log(`${date}: ` + chalk.green(message) + propsString);
        break;
      case 'warning':
        console.error(`${date}: ` + chalk.yellow(message) + propsString);
        break;
      case 'error':
        console.error(`${date}: ` + chalk.red(message) + propsString);
        break;
      case 'critical':
        console.error(`${date}: ` + chalk.red.bold(message) + propsString);
        break;
      default:
        console.log(`${date}: ` + chalk.dim(message) + propsString);
        break;
    }
  }

  generateCorrelationId() {
    return randomBytes(18).toString('base64');
  }

  /**
   * Write to log.
   *
   * @param object data
   *   Object with properties:
   *   - severity: "info", "warning", "error" or "critical"
   *   - correlationId: string (optional)
   *   - message: string (required)
   *   Additional properties may provided. Value must be a string.
   */
  log(data) {
    data.timestamp = (new Date()).toISOString();
    if (this.logTo.indexOf('console') >= 0) {
      this.writeToConsole(data);
    }
    if (this.logTo.indexOf('json') >= 0) {
      console.log(JSON.stringify(data));
    }
    if (this.logTo.indexOf('file') >= 0) {
      const jsonData = JSON.stringify(data);
      this.buffer.push(jsonData);
      this.bufferSize += jsonData.length;
      if (this.bufferSize > this.maxBufferSize) {
        this.flush();
      }
    }
  }

  debug(message) {
    this.log({severity: 'debug', message});
  }

  info(message) {
    this.log({severity: 'info', message});
  }

  warning(message) {
    this.log({severity: 'warning', message});
  }

  error(message) {
    this.log({severity: 'error', message});
  }

  critical(message) {
    this.log({severity: 'critical', message});
  }
}

Log.singleton = true;
Log.require = ['Config'];

module.exports = Log;
