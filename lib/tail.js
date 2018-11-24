//
//  tail.js
//  Resitail
//
//  Copyright 2017-present Zuhd Web Services
//  https://zuhd.org
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

const EventEmitter = require('events').EventEmitter;
const childProcess = require('child_process');
const util = require('util');
const CBuffer = require('CBuffer');
const byline = require('byline');

function Tail(path, opts) {
    EventEmitter.call(this);

    const options = opts || {
        buffer: 0,
    };
    this._buffer = new CBuffer(options.buffer);

    if (path[0] === '-') {
        byline(process.stdin).on('data', (line) => {
            const str = line.toString();
            this._buffer.push(str);
            this.emit('line', str);
        });
    } else {
        const tail = childProcess.spawn('tail', ['-n', options.buffer, '-F'].concat(path));

        tail.stderr.on('data', (data) => {
            // If there is any important error then display it in the console. Tail will keep running.
            // File can be truncated over network.
            console.error('error: ' + data.toString());
            if (data.toString().indexOf('file truncated') === -1) {
                this.emit('error', '=== file truncated ===');
            }
        });

        byline(tail.stdout).on('data', (line) => {
            const str = line.toString();
            this._buffer.push(str);
            if (str.indexOf('==>') === 0 && str.indexOf('<==') === str.length - 3 /* length(<==) */) {
                this.emit('info', str);
            } else {
                this.emit('line', str);
            }
        });

        process.on('exit', () => {
            tail.kill();
        });
    }
}
util.inherits(Tail, EventEmitter);

Tail.prototype.getBuffer = function getBuffer() {
    return this._buffer.toArray();
};

Tail.prototype.kill = function kill() {
    if (typeof this._tail === 'undefined') {
        return;
    }
    return this._tail.kill();
};

module.exports = (path, options) => new Tail(path, options);
