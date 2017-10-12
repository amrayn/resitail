// code mostly taken from https://github.com/muflihun/residue-node/blob/master/src/residue.js
let crypto;
try {
    crypto = require('crypto');
} catch (err) {
    console.log('requires crypto (https://nodejs.org/api/crypto.html)');
}

function ResidueCrypt(residue_config) {
  this.residue_config = residue_config;
}

ResidueCrypt.prototype.encrypt = function(request) {
  let encryptedRequest;
  try {
      let iv = new Buffer(crypto.randomBytes(16), 'hex');
      let cipher = crypto.createCipheriv('aes-256-cbc', new Buffer(this.residue_config.server_key, 'hex'), iv);
      return iv.toString('hex') + ':' + cipher.update(JSON.stringify(request), 'utf-8', 'base64') + cipher.final('base64') + '\r\n\r\n';
  } catch (err) {
      console.log(err);
  }
  return '';
}

ResidueCrypt.prototype.decrypt = function(data) {
    try {
        const resp = data.split(':');
        const iv = resp[0];
        const clientId = resp.length === 3 ? resp[1] : '';
        const actualData = resp.length === 3 ? resp[2] : resp[1];
        const binaryData = new Buffer(actualData, 'base64');
        let decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer(this.residue_config.server_key, 'hex'), new Buffer(iv, 'hex'));
        decipher.setAutoPadding(false);

        let plain = decipher.update(binaryData, 'base64', 'utf-8');
        plain += decipher.final('utf-8');
        // Remove non-ascii characters from decrypted text ! Argggh!
        plain = plain.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
        return plain;
    } catch (err) {
        console.log(err);
    }
    return null;
}

module.exports = (residue_config) => new ResidueCrypt(residue_config);
