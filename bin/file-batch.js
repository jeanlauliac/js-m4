'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var fs = require('fs');

module.exports = FileBatch;
util.inherits(FileBatch, EventEmitter);

function FileBatch(files, output) {
    EventEmitter.call(this);
    this._files = files;
    this._output = output;
    this._aborted = false;
    this._abort = null;
}

FileBatch.prototype.execute = function () {
    this._processNext(0);
};

FileBatch.prototype.abort = function () {
    if (this.aborted_) return;
    if (this._abort !== null) this._abort();
    this.aborted_ = true;
};

FileBatch.prototype._processNext = function (ix) {
    var self = this;
    this._abort = null;
    if (ix >= this._files.length || this.aborted_)
        return process.nextTick(self.emit.bind(self, 'done'));
    var input = openInput(this._files[ix]);
    input.pipe(this._output, {end: false});
    input.on('error', function onInputError(err) {
        input.unpipe(self._output);
        self.emit('error', new BatchError('input', err));
        self._processNext(ix + 1);
    });
    this._output.on('error', function onOutputError(err) {
        input.unpipe(self._output);
        input.close();
        self.emit('error', new BatchError('output', err));
        self.emit('done');
    });
    input.on('end', function () {
        input.unpipe(self._output);
        return self._processNext(ix + 1);
    });
    this._abort = function () {
        input.unpipe(self._output);
        input.close();
        self.emit('done');
    };
};

function openInput(path) {
    if (path === '-') return process.stdin;
    return fs.createReadStream(path, {encoding: 'utf8'});
}

util.inherits(BatchError, Error);

function BatchError(source, inner) {
    Error.call(this, 'error on ' + source);
    this.source = source;
    this.inner = inner;
}
