'use strict';

var M4Error = require('./m4-error');

module.exports = Tokenizer;

var Type = {
    END: -1,
    NAME: 0,
    STRING: 1,
    LITERAL: 3,
    COMMENT: 4
};

Tokenizer.Type = Type;

function Tokenizer() {
    this._source = '';
    this._sourceIx = 0;
    this._buffer = '';
    this._state = 0;
    this._quotes = 0;
    this._leftQuote = '`';
    this._rightQuote = '\'';
    this._readNext = this._readToken;
    this._end = false;
}

Tokenizer.prototype.changeQuote = function (lhs, rhs) {
    this._leftQuote = lhs;
    this._rightQuote = rhs;
};

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
    this._buffer += c;
    if (/[a-zA-Z_]/.test(c)) {
        this._readNext = this._readName;
        return null;
    }
    if (this._leftQuote.length > 0 && c === this._leftQuote[0]) {
        if (this._leftQuote.length === 1) {
            this._readNext = this._readString;
            ++this._quotes;
            this._buffer = '';
        } else {
            this._readNext = this._readLeftQuote;
        }
        return null;
    }
    ++this._sourceIx;
    return this._token(Type.LITERAL);
};

Tokenizer.prototype._readLeftQuote = function (c) {
    if (c === this._leftQuote[this._buffer.length]) {
        this._buffer += c;
        if (this._buffer.length === this._leftQuote.length) {
            this._readNext = this._readString;
            ++this._quotes;
            this._buffer = '';
        }
        return null;
    }
    this.unshift(this._buffer.substr(1));
    this._buffer = this._buffer.substr(0, 1);
    return this._token(Type.LITERAL);
};

Tokenizer.prototype._readString = function (c) {
    if (c === null)
        throw new M4Error(M4Error.Code.E_EOF_IN_STR);
    this._buffer += c;
    var leftTrailPos = this._buffer.length - this._leftQuote.length;
    var rightTrailPos = this._buffer.length - this._rightQuote.length;
    if (this._buffer.substr(leftTrailPos) === this._leftQuote) {
        ++this._quotes;
    } else if (this._buffer.substr(rightTrailPos) === this._rightQuote) {
        --this._quotes;
        if (this._quotes === 0) {
            ++this._sourceIx;
            this._buffer = this._buffer.substr(0, rightTrailPos);
            return this._token(Type.STRING);
        }
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

Tokenizer.prototype._token = function (type) {
    var buffer = this._buffer;
    this._readNext = this._readToken;
    this._buffer = '';
    return {type: type, value: buffer};
};
