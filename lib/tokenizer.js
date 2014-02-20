'use strict';

var util = require('util');

module.exports = function (opts) {
    return new Tokenizer(opts);
};

var Type = {
    END: -1,
    NAME: 0,
    STRING: 1,
    LITERAL: 3,
    COMMENT: 4
};

module.exports.Type = Type;

function Tokenizer(opts) {
    this._source = '';
    this._sourceIx = 0;
    this._buffer = '';
    this._state = 0;
    this._quotes = 0;
    this._readNext = this._readToken;
    this._end = false;
}

Tokenizer.prototype.push = function (str) {
    if (typeof str !== 'string') throw new Error('cannot insert a non-string');
    this._flush();
    this._source = this._source + str;
    return this;
};

Tokenizer.prototype.unshift = function (str) {
    if (typeof str !== 'string') throw new Error('cannot insert a non-string');
    this._flush();
    this._source = str + this._source;
    return this;
};

Tokenizer.prototype.end = function () {
    this._end = true;
};

Tokenizer.prototype.isEnd = function () {
    return this._end;
};

Tokenizer.prototype.peekChar = function () {
    if (this._source === '') return null;
    return this._source[this._sourceIx];
};

Tokenizer.prototype._flush = function () {
    this._source = this._source.substr(this._sourceIx);
    this._sourceIx = 0;
};

Tokenizer.prototype.read = function () {
    while (this._sourceIx < this._source.length) {
        var c = this._source[this._sourceIx];
        var token = this._readNext(c);
        if (token !== null) return token;
        ++this._sourceIx;
    }
    if (!this._end) return null;
    return this._readNext(null);
};

Tokenizer.prototype._readToken = function (c) {
    if (c === null) {
        this._end = false;
        return this._token(Type.END);
    }
    if (c === '`') {
        this._readNext = this._readString;
        return null;
    }
    this._buffer += c;
    if (/[a-zA-Z_]/.test(c))
        this._readNext = this._readName;
    else
        this._readNext = this._readLiteral;
    return null;
};

Tokenizer.prototype._readString = function (c) {
    if (c === null) {
        this.emit('error', new Error('unmatched quote'));
    } else if (c === '`') {
        ++this._quotes;
    } else if (c !== '\'') {
        this._buffer += c;
    } else if (this._quotes === 0) {
        this._readNext = (function () {
            return this._token(Type.STRING);
        }).bind(this);
    } else {
        --this._quotes;
    }
    return null;
};

Tokenizer.prototype._readName = function (c) {
    if (c === null || !/[a-zA-Z0-9_]/.test(c)) {
        return this._token(Type.NAME);
    }
    this._buffer += c;
    return null;
};

Tokenizer.prototype._readLiteral = function (c) {
    return this._token(Type.LITERAL);
};

Tokenizer.prototype._token = function (type) {
    var buffer = this._buffer;
    this._readNext = this._readToken;
    this._buffer = '';
    return {type: type, value: buffer};
};
