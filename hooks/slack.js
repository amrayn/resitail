//
//  slack.js
//  A resitail hook that streams logs to the slack
//
//  Resitail
//
//  Copyright 2017-present Muflihun Labs
//
//  Author: @abumusamq
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//

"use strict";
const slackbot = require('slack-node');
const merge = require('lodash.merge');

function SlackHook(config, serverInfo) {
    this.config = config;
    this.serverInfo = serverInfo;

    if (!this.config.channels) {
        throw ('Invalid configuration. Missing: channels');
    }

    this.slack = new slackbot();
    this.slack.setWebhook(this.config.webhook_url);


    this.formatText = (data, template) => template.replace('%line', data).
    replace("&", "&amp;").
    replace("<", "&lt;").
    replace(">", "&gt;");

    this.send = (data) => {
        let request = {};

        if (this.config.special_cases) {
            for (let i = 0; i < this.config.special_cases.length; ++i) {
                const c = this.config.special_cases[i];
                if (c.text && data.line.indexOf(c.text) > -1) {
                    request.attachments = [{
                        "color": c.color,
                        "text": this.formatText(data.line, c.template || this.config.template),
                        "pretext": c.message ? this.formatText(data.line, c.message) : null,
                        "mrkdwn_in": ["text", "pretext"]
                    }];
                    break;
                }
            }
        }
        if (!request.attachments) {
            request.text = this.formatText(data.line, this.config.template || '%line');
        }
        this.slack.webhook(merge({
            channel: data.channel_name,
            username: this.config.username || 'resitail',
        }, request), (err, response) => {
            if (err || response.status === 'fail') {
                if (typeof response !== "undefined") {
                    console.log(response.response + ' - channel: ' + data.channel_name);
                }
            }
        });
    }
}

module.exports = (config, serverInfo) => new SlackHook(config, serverInfo);
