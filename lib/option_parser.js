const proc = require('commander');

proc
  .version(require('../package.json').version)
  .usage('[options]')
  .option('-c, --config <config.json>', 'Configuration file', String, false);

module.exports = proc;
