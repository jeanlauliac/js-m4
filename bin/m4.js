#!/usr/bin/env node
'use strict';

var M4 = require('..');
var nopt = require('nopt');
var path = require('path');
var fs = require('fs');
var npmlog = require('npmlog');
var Sysexits = require('sysexits');
var FileBatch = require('./file-batch.js');

var knownOpts = {
    'help': Boolean,
    'version': Boolean,
    'fatal-warnings': Boolean,
    'prefix-builtins': Boolean,
    'quiet': Boolean,
    'define': String,
    'include': path,
    'synclines': Boolean,
    'undefine': String,
    'source-map': path,
    'output': path,
    'extensions': Boolean,
    'nesting-limit': Number,
    'freeze-state': path,
    'reload-state': path,
    'debug': String
};

var shortHands = {
    'v': 'version',
    'E': 'fatal-warnings',
    'P': 'prefix-builtins',
    'silent': 'quiet',
    'Q': 'quiet',
    'D': 'define',
    'I': 'include',
    's': 'synclines',
    'U': 'undefine',
    'm': 'source-map',
    'o': 'output',
    'L': 'nesting-limit',
    'F': 'freeze-state',
    'R': 'reload-state',
    'd': 'debug'
};

function main() {
    var opts = nopt(knownOpts, shortHands);
    var files = opts.argv.remain;
    if (opts.help) return help();
    if (opts.version) return version();
    if (!process.stdout.isTTY)
        npmlog.heading = path.basename(process.argv[1]);
    run(opts, files);
}

function help() {
    var opts = {encoding: 'utf8'};
    fs.readFile(path.join(__dirname, 'help'), opts, function (err, data) {
        if (err) {
            npmlog.error(null, err.message);
            process.exit(Sysexits.IOERR);
        }
        process.stderr.write(data);
    });
}

function version() {
    var pack = require(path.join(__dirname, '../package.json'));
    console.log(pack.version);
}

function run(opts, files) {
    var output = process.stdout;
    var errored = false;
    if (typeof opts.output !== 'undefined') {
        output = fs.createWriteStream(opts.output, {encoding: 'utf8'});
    }
    process.stdin.setEncoding('utf8');
    if (files.length === 0) files = ['-'];
    var m4 = new M4();
    var batch = new FileBatch(files, m4, end.bind(null, m4, output));
    m4.on('warning', function (err) {
        npmlog.warn(null, err.message);
    });
    batch.on('error', function (err) {
        npmlog.error(err.source === 'output' ? 'm4' : 'input',
                     err.inner.message);
        errored = true;
    });
    m4.pipe(output, {end: false});
    batch.on('done', function () { end(m4, output, errored); });
    batch.execute();
    output.on('error', function (err) {
        npmlog.error('output', err.message);
        m4.unpipe(output);
        batch.abort();
    });
}

function end(m4, output, errored) {
    if (!errored) m4.end();
    if (output !== process.stdout) output.end();
    if (errored) process.exit(1);
}

main();
