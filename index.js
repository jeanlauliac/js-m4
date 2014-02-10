'use strict';

var Transform = require('stream').Transform;
var util = require('util');
var tokenizer = require('./lib/tokenizer');

module.exports = function (opts) {
    return new M4(opts);
};

util.inherits(M4, Transform);

function M4(opts) {
    Transform.call(this, {decodeStrings: false, encoding: 'utf8'});
    this._macros = {};
    this._buffers = [];
    this._curBufIx = 0;
    this._tokenizer = tokenizer();
    this.defineFn('define', this.define.bind(this));
    this.defineFn('divert', this.divert.bind(this));
    this.defineFn('dnl', this.dnl.bind(this));
}

M4.prototype._transform = function (chunk, encoding, cb) {
    this._tokenizer.write(chunk);
    this._tokenizer.once('readable', function () {
        var token = this._tokenizer.read();
        console.error('READABLE \\o/', token);
        while (token !== null) {
            this.push(token.value);
            token = this._tokenizer.read();
        }
        cb();
    });
};

M4.prototype.defineFn = function (name, fn) {
    this._macros[name] = fn;
};

M4.prototype.define = function (name, content) {
    this.defineFn(name, identity.bind(null, content));
};

M4.prototype.divert = function (bufIx) {
    if (bufIx === null || typeof bufIx === 'undefined') bufIx = 0;
    this._curBufIx = bufIx;
};

M4.prototype.dnl = function () {

};

function identity(val) {
    return val;
}
