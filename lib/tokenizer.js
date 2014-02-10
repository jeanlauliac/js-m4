'use strict';

var Transform = require('stream').Transform;
var util = require('util');

module.exports = function (opts) {
    return new Tokenizer(opts);
};

var Type = {
    NAME: 0,
    STRING: 1,
    LITERAL: 3,
    COMMENT: 4
};

module.exports.Type = Type;

util.inherits(Tokenizer, Transform);

function Tokenizer(opts) {
    Transform.call(this, {
        decodeStrings: false
    });
    this._readableState.objectMode = true;
    this._buffer = '';
    this._state = 0;
    this._quotes = 0;
    this._readNext = this._readToken;
}

Tokenizer.prototype._transform = function (chunk, encoding, cb) {
    var i = 0;
    while (i < chunk.length) {
        var c = chunk[i];
        var token = this._readNext(c);
        if (typeof token !== 'undefined') {
            this.push(token);
            this._readNext = this._readToken;
            this._buffer = '';
        } else {
            ++i;
        }
    }
    return cb();
};

Tokenizer.prototype._flush = function (cb) {
    var token = this._readNext(null);
    this.push(token);
    return cb();
};

Tokenizer.prototype._readToken = function (c) {
    if (c === null) return null;
    if (c === '`')
        return void(this._readNext = this._readString);
    this._buffer += c;
    if (/[a-zA-Z_]/.test(c))
        return void(this._readNext = this._readName);
    this._readNext = this._readLiteral;
    return;
};

Tokenizer.prototype._readString = function (c) {
    if (c === null)
        return this.emit('error', new Error('unmatched quote'));
    if (c === '`')
        return void(++this._quotes);
    if (c !== '\'')
        return void(this._buffer += c);
    if (this._quotes === 0)
        return void(this._readNext = (function () {
            return this._token(Type.STRING);
        }).bind(this));
    --this._quotes;
    return;
};

Tokenizer.prototype._readName = function (c) {
    if (c === null || !/[a-zA-Z0-9_]/.test(c)) {
        return this._token(Type.ID);
    }
    this._buffer += c;
};

Tokenizer.prototype._readLiteral = function (c) {
    return this._token(Type.LITERAL);
};

Tokenizer.prototype._token = function (type) {
    return {type: type, value: this._buffer};
};
