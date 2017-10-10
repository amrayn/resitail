const request = require('request');

const SlackBot = function(config) {
  if (!config) return null;

  this._url = `https://${config.orgdomain}.slack.com/services/hooks/slackbot?token=${config.token}&channel=%23${config.channel}`;

  this.send = function(data) {
    if (!data || data.length <= 0) {
      return;
    }
    request({
      url    : this._url,
      method : 'POST',
      body   : data
    }, function(error, response, body) {
      console.log(error ? error : body);
    });
  }
}

module.exports = SlackBot;
