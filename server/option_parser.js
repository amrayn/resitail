const proc = require('commander');

proc
  .version(require('../package.json').version)
  .usage('[options]')
  .option('-p, --port <port>', 'listening port, default 9001', Number, 3000)
  .option('-c, --config <file.json>', 'Provide residue configuration file', String, false);

module.exports = proc;
