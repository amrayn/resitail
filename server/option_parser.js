const proc = require('commander');

proc
  .version(require('../package.json').version)
  .usage('[options]')
  .option('-p, --port <port>', 'listening port, default 9001', Number, 3000)
  .option('-c, --config <config_file.json>', 'Provide residue configuration file', String, false)
  .option('-s, --slackconfig <slack_config_file.json>', 'Slack bot configuration file', String, false);

module.exports = proc;
