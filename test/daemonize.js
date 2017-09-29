'use strict';

const daemon = require('daemon');
const optionsParser = require('../lib/options_parser');
const daemonize = require('../lib/daemonize');
const sinon = require('sinon');
const fs = require('fs');

describe('daemonize', () => {
  beforeEach(() => {
    sinon.stub(daemon, 'daemon');
    daemon.daemon.returns({
      pid: 1000,
    });
    sinon.stub(fs, 'writeFileSync');
    sinon.stub(fs, 'openSync');
  });

  afterEach(() => {
    daemon.daemon.restore();
    fs.writeFileSync.restore();
    fs.openSync.restore();
  });

  describe('should daemon', () => {
    it('current script', () => {
      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[0].should.match('script');
    });

    it('with hostname', () => {
      optionsParser.parse(['node', '/path/to/resitail', '-h', '127.0.0.1']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['-h', '127.0.0.1']);
    });

    it('with port', () => {
      optionsParser.parse(['node', '/path/to/resitail', '-p', '80']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['-p', 80]);
    });

    it('with lines number', () => {
      optionsParser.parse(['node', '/path/to/resitail', '-n', '1']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['-n', 1]);
    });

    it('with lines stored in browser', () => {
      optionsParser.parse(['node', '/path/to/resitail', '-l', '1']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['-l', 1]);
    });

    it('with theme', () => {
      optionsParser.parse(['node', '/path/to/resitail', '-t', 'dark']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['-t', 'dark']);
    });

    it('with authorization', () => {
      optionsParser.parse(['node', '/path/to/resitail', '-U', 'user', '-P', 'passw0rd']);

      daemonize('script', optionsParser, {
        doAuthorization: true,
      });

      daemon.daemon.lastCall.args[1].should.containDeep(['-U', 'user', '-P', 'passw0rd']);
    });

    it('without authorization if option doAuthorization not passed', () => {
      optionsParser.parse(['node', '/path/to/resitail', '-U', 'user', '-P', 'passw0rd']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.not.containDeep(['-U', 'user', '-P', 'passw0rd']);
    });

    it('with secure connection', () => {
      optionsParser.parse(['node', '/path/to/resitail', '-k', 'key.file', '-c', 'cert.file']);

      daemonize('script', optionsParser, {
        doSecure: true,
      });

      daemon.daemon.lastCall.args[1].should.containDeep(['-k', 'key.file', '-c', 'cert.file']);
    });

    it('without secure connection if option doSecure not passed', () => {
      optionsParser.parse(['node', '/path/to/resitail', '-k', 'key.file', '-c', 'cert.file']);

      daemonize('script', optionsParser, {
        doSecure: true,
      });

      daemon.daemon.lastCall.args[1].should.containDeep(['-k', 'key.file', '-c', 'cert.file']);
    });

    it('with hide-topbar option', () => {
      optionsParser.parse(['node', '/path/to/resitail', '--ui-hide-topbar']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['--ui-hide-topbar']);
    });

    it('with no-indent option', () => {
      optionsParser.parse(['node', '/path/to/resitail', '--ui-no-indent']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['--ui-no-indent']);
    });

    it('with highlight option', () => {
      optionsParser.parse(['node', '/path/to/resitail', '--ui-highlight']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['--ui-highlight']);
      daemon.daemon.lastCall.args[1].should.containDeep(['--ui-highlight-preset', './preset/default.json']);
    });

    it('with file to tail', () => {
      optionsParser.parse(['node', '/path/to/resitail', '/path/to/file']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['/path/to/file']);
    });
  });

  it('should write pid to pidfile', () => {
    optionsParser.parse(['node', '/path/to/resitail', '--pid-path', '/path/to/pid']);

    daemonize('script', optionsParser);

    fs.writeFileSync.lastCall.args[0].should.be.equal('/path/to/pid');
    fs.writeFileSync.lastCall.args[1].should.be.equal(1000);
  });

  it('should log to file', () => {
    optionsParser.parse(['node', '/path/to/resitail', '--log-path', '/path/to/log']);
    fs.openSync.returns('file');

    daemonize('script', optionsParser);

    fs.openSync.lastCall.args[0].should.equal('/path/to/log');
    fs.openSync.lastCall.args[1].should.equal('a');
    daemon.daemon.lastCall.args[2].should.eql({
      stdout: 'file',
      stderr: 'file',
    });
  });
});
