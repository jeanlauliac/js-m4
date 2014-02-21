'use strict';

var Transform = require('stream').Transform;
var util = require('util');
var Tokenizer = require('./lib/tokenizer');
var expand = require('./lib/expand');
var util = require('util');

module.exports = M4;
util.inherits(M4, Transform);

var ErrDescs = {
    EINVRET: 'macro function \'%s\' did not return a string',
    ENESTLIMIT: 'too much macro nesting (max. %s)'
};

function error() {
    var args = Array.prototype.slice.call(arguments);
    var code = args.shift();
    var err = new Error(util.format.apply(null, [ErrDescs[code]].concat(args)));
    err.code = code;
    err.args = args;
    return err;
}

function makeMacro(fn, inert) {
    if (typeof inert === 'undefined') inert = false;
    return function macro() {
        var args = Array.prototype.slice.call(arguments);
        var self = args.shift();
        if (inert && args.length === 0) return '`' + self + '\'';
        return fn.apply(null, args);
    };
}

function M4(opts) {
    Transform.call(this, {decodeStrings: false, encoding: 'utf8'});
    this._opts = {};
    for (var opt in opts) this._opts[opt] = opts[opt];
    this._opts.nestingLimit = this._opts.nestingLimit || 0;
    this._macros = {};
    this._pending = null;
    this._macroStack = [];
    this._buffers = [];
    this._curBufIx = 0;
    this._tokenizer = new Tokenizer();
    this._err = null;
    this.define('define', makeMacro(this.define.bind(this), true));
    this.define('divert', makeMacro(this.divert.bind(this)));
    this.define('dnl', makeMacro(this.dnl.bind(this)));
}

M4.prototype._transform = function (chunk, encoding, cb) {
    if (this._err !== null) return cb();
    try {
        this._tokenizer.push(chunk);
        this._processPendingMacro();
        var token = this._tokenizer.read();
        while (token !== null) {
            this._processToken(token);
            this._processPendingMacro();
            token = this._tokenizer.read();
        }
    } catch (err) {
        this._err = err;
        return cb(err);
    }
    return cb();
};

M4.prototype._flush = function (cb) {
    this._tokenizer.end();
    this._transform('', null, cb);
};

M4.prototype._startMacroArgs = function () {
    if (this._opts.nestingLimit > 0 &&
        this._macroStack.length === this._opts.nestingLimit) {
        throw error('ENESTLIMIT', this._opts.nestingLimit);
    }
    this._tokenizer.read();
    this._pending.args.push('');
    this._macroStack.push(this._pending);
    this._pending = null;
};

M4.prototype._callMacro = function (fn, args) {
    var result = fn.apply(null, args);
    if (typeof result !== 'string')
        throw error('EINVRET', args[0]);
    return result;
};

M4.prototype._processPendingMacro = function () {
    if (this._pending === null) return;
    if (this._tokenizer.peekChar() === null &&
        !this._tokenizer.isEnd()) return;
    if (this._tokenizer.peekChar() === '(')
        return this._startMacroArgs();
    var result = this._callMacro(this._pending.fn, this._pending.args);
    this._tokenizer.unshift(result);
    this._pending = null;
};

M4.prototype._processToken = function (token) {
    if (token.type === Tokenizer.Type.NAME &&
        this._macros.hasOwnProperty(token.value)) {
        this._pending = {fn: this._macros[token.value], args: [token.value]};
        return;
    }
    if (this._macroStack.length === 0) {
        this.push(token.value);
        return;
    }
    var macro = this._macroStack[this._macroStack.length - 1];
    if (token.type === Tokenizer.Type.LITERAL) {
        if (token.value === ',') {
            macro.args.push('');
            return;
        } else if (token.value === ')') {
            macro = this._macroStack.pop();
            var result = this._callMacro(macro.fn, macro.args);
            this._tokenizer.unshift(result);
            return;
        }
    }
    macro.args[macro.args.length - 1] += token.value;
};

M4.prototype.define = function (name, fn) {
    if (typeof name !== 'string' || name.length === 0) return '';
    if (typeof fn === 'undefined') fn = '';
    if (typeof fn !== 'function')
        fn = expand.bind(null, fn);
    this._macros[name] = fn;
    return '';
};

M4.prototype.divert = function (bufIx) {
    if (bufIx === null || typeof bufIx === 'undefined') bufIx = 0;
    this._curBufIx = bufIx;
    return '';
};

M4.prototype.dnl = function () {
    return '';
};
