const proc = require('commander');

proc
  .version(require('../package.json').version)
  .usage('[options]')
  .option('-p, --port <port>', 'listening port, default 9001', Number, 3000)
  .option('-c, --residue_config <residue_config.json>', 'Residue configuration file', String, false)
  .option('-s, --slack_config <slack_config.json>', 'Slack configuration file', String, false);

module.exports = proc;
