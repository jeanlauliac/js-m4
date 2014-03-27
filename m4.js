'use strict';

var Transform = require('stream').Transform;
var util = require('util');
var Tokenizer = require('./lib/tokenizer');
var expand = require('./lib/expand');
var M4Error = require('./lib/m4-error');
var Code = M4Error.Code;
var util = require('util');

module.exports = M4;
util.inherits(M4, Transform);

function M4(opts) {
    Transform.call(this, {decodeStrings: false, encoding: 'utf8'});
    this._opts = {};
    for (var opt in opts) this._opts[opt] = opts[opt];
    this._opts.nestingLimit = this._opts.nestingLimit || 0;
    this._opts.extensions = this._opts.extensions || false;
    this._macros = {};
    this._pending = null;
    this._macroStack = [];
    this._buffers = [];
    this._divertIx = 0;
    this._diversions = [];
    this._skipWhitespace = false;
    this._tokenizer = new Tokenizer();
    this._err = null;
    this._dnlMode = false;
    this._registerBuiltins();
}

M4.prototype._registerBuiltins = function () {
    this._defineMacro('define', this.define.bind(this), true);
    this._defineMacro('divert', this.divert.bind(this));
    this._defineMacro('undivert', this.undivert.bind(this), false, true);
    this._defineMacro('divnum', this.divnum.bind(this));
    this._defineMacro('dnl', this.dnl.bind(this));
    this._defineMacro('changequote', this.changeQuote.bind(this));
};

M4.prototype._defineMacro = function (name, fn, inert, dynArgs) {
    this.define(name, this._makeMacro(fn, inert, dynArgs));
};

M4.prototype._makeMacro = function (fn, inert, dynArgs) {
    if (typeof inert === 'undefined') inert = false;
    if (typeof dynArgs === 'undefined') dynArgs = false;
    return (function macro() {
        var args = Array.prototype.slice.call(arguments);
        var macroName = args.shift();
        if (inert && args.length === 0) return '`' + macroName + '\'';
        if (!dynArgs && args.length > fn.length) {
            var err = new M4Error(Code.W_TOO_MANY_ARGS, macroName);
            this.emit('warning', err);
        }
        var res = fn.apply(null, args);
        if (typeof res === 'undefined') return '';
        return res + '';
    }).bind(this);
};

M4.prototype._transform = function (chunk, encoding, cb) {
    if (this._err !== null) return cb();
    try {
        this._tokenizer.push(chunk);
        this._processPendingMacro();
        var token = this._tokenizer.read();
        while (token !== null) {
            if (this._dnlMode) {
                if (token.value === '\n') this._dnlMode = false;
            } else {
                this._processToken(token);
            }
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
    this._transform('', null, (function (err) {
        if (err) return cb(err);
        this.divert();
        this._undivertAll();
        return cb();
    }).bind(this));
};

M4.prototype._startMacroArgs = function () {
    if (this._opts.nestingLimit > 0 &&
        this._macroStack.length === this._opts.nestingLimit) {
        throw new M4Error(Code.E_NEST_LIMIT, this._opts.nestingLimit);
    }
    this._tokenizer.read();
    this._pending.args.push('');
    this._macroStack.push(this._pending);
    this._pending = null;
    this._skipWhitespace = true;
};

M4.prototype._callMacro = function (fn, args) {
    var result = fn.apply(null, args);
    if (typeof result !== 'string')
        throw new M4Error(Code.E_INV_RET, args[0]);
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
    if (this._skipWhitespace && token.type === Tokenizer.Type.LITERAL &&
        /\s/.test(token.value)) return;
    this._skipWhitespace = false;
    if (token.type === Tokenizer.Type.NAME &&
        this._macros.hasOwnProperty(token.value)) {
        this._pending = {fn: this._macros[token.value], args: [token.value]};
        return;
    }
    if (this._macroStack.length === 0)
        return this._pushOutput(token.value);
    var macro = this._macroStack[this._macroStack.length - 1];
    if (token.type === Tokenizer.Type.LITERAL) {
        if (token.value === ',') {
            macro.args.push('');
            this._skipWhitespace = true;
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

M4.prototype._pushOutput = function (output) {
    if (this._divertIx < 0) return;
    if (this._divertIx === 0)
        return this.push(output);
    this._diversions[this._divertIx - 1] += output;
};

M4.prototype.define = function (name, fn) {
    if (typeof name !== 'string' || name.length === 0) return '';
    if (typeof fn === 'undefined') fn = '';
    if (typeof fn !== 'function')
        fn = expand.bind(null, fn);
    this._macros[name] = fn;
};

M4.prototype.divert = function (ix) {
    if (ix === null || typeof ix === 'undefined') ix = 0;
    this._divertIx = +ix;
    if (typeof this._diversions[this._divertIx - 1] === 'undefined') {
        this._diversions[this._divertIx - 1] = '';
    }
};

M4.prototype.undivert = function () {
    var ics = Array.prototype.slice.call(arguments);
    if (ics.length === 0) {
        this._undivertAll();
        return;
    }
    while (ics.length > 0) {
        var arg = ics.pop();
        if (arg === '') continue;
        var i = +arg;
        if (i + '' === arg) {
            this._undivert(+i);
        } else {
            if (this._opts.extensions) {
                throw new Error('not implemented');
            } else {
                this.emit('warning', new M4Error(Code.W_TXT_UNDIV, arg));
            }
        }
    }
};

M4.prototype.divnum = function () {
    return this._divertIx;
};

M4.prototype._undivertAll = function () {
    for (var i = 1; i <= this._diversions.length; ++i) {
        this._undivert(i);
    }
};

M4.prototype._undivert = function (i) {
    if (i <= 0 || this._divertIx === i) return;
    if (typeof this._diversions[i - 1] === 'undefined') return;
    this._pushOutput(this._diversions[i - 1]);
    delete this._diversions[i - 1];
};

M4.prototype.dnl = function () {
    this._dnlMode = true;
};

M4.prototype.changeQuote = function (lhs, rhs) {
    if (typeof lhs === 'undefined') {
        lhs = '`';
        rhs = '\'';
    } else if (typeof rhs === 'undefined') {
        rhs = '\'';
    }
    this._tokenizer.changeQuote(lhs, rhs);
};
