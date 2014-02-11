'use strict';

var Transform = require('stream').Transform;
var util = require('util');
var tokenizer = require('./lib/tokenizer');

module.exports = function (opts) {
    return new M4(opts);
};

module.exports.expand = expand;

util.inherits(M4, Transform);

function M4(opts) {
    Transform.call(this, {decodeStrings: false, encoding: 'utf8'});
    this._macros = {};
    this._pending = null;
    this._macroStack = [];
    this._buffers = [];
    this._curBufIx = 0;
    this._tokenizer = tokenizer();
    this.defineFn('define', this.define.bind(this));
    this.defineFn('divert', this.divert.bind(this));
    this.defineFn('dnl', this.dnl.bind(this));
}

M4.prototype._transform = function (chunk, encoding, cb) {
    this._tokenizer.push(chunk);
    while (this._transformNext()) {}
    return cb();
};

M4.prototype._flush = function (cb) {
    this._tokenizer.end();
    while (this._transformNext()) {}
    return cb();
};

M4.prototype._transformNext = function () {
    var result;
    if (this._pending !== null) {
        if (this._tokenizer.peekChar() === '(') {
            this._tokenizer.read();
            this._macroStack.push({macro: this._pending, args: ['']});
            this._pending = null;
        } else if (this._tokenizer.peekChar() === null) {
            return false;
        } else {
            result = this._pending();
            this._tokenizer.unshift(result);
        }
    }
    var token = this._tokenizer.read();
    if (typeof token === 'undefined') return false;
    if (token.type === tokenizer.Type.NAME &&
        this._macros.hasOwnProperty(token.value)) {
        this._pending = this._macros[token.value];
        return true;
    }
    if (this._macroStack.length > 0) {
        var top = this._macroStack[this._macroStack.length - 1];
        if (token.type === tokenizer.Type.LITERAL) {
            if (token.value === ',') {
                top.args.push('');
                return true;
            } else if (token.value === ')') {
                top = this._macroStack.pop();
                result = top.macro.apply(null, top.args);
                this._tokenizer.unshift(result);
                return true;
            }
        }
        top.args[top.args.length - 1] += token.value;
        return true;
    }
    this.push(token.value);
    return true;
};

M4.prototype.defineFn = function (name, fn) {
    this._macros[name] = fn;
};

M4.prototype.define = function (name, content) {
    this.defineFn(name, expand.bind(null, content));
};

M4.prototype.divert = function (bufIx) {
    if (bufIx === null || typeof bufIx === 'undefined') bufIx = 0;
    this._curBufIx = bufIx;
};

M4.prototype.dnl = function () {

};

function expand() {
    var args = Array.prototype.slice.call(arguments);
    var val = args.shift();
    val = val.replace(/$([0-9]+)/g, function (match, nb) {
        nb = +nb;
        if (nb >= args.length) return '';
        return args[nb];
    });
    return val;
}
