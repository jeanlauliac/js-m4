'use strict';

var test = require('tape');
var M4 = require('..');
var M4Error = require('../lib/m4-error');
var fs = require('fs');
var path = require('path');

function streamEqual(t, lhs, rhs, cb) {
    var count = 0;
    var lbuf = '';
    lhs.on('readable', function () {
        lbuf += lhs.read();
    });
    var rbuf = '';
    rhs.on('readable', function () {
        rbuf += rhs.read();
    });
    var bothEnd = function () {
        ++count;
        if (count < 2) return;
        t.equal(lbuf, rbuf);
        return cb();
    };
    lhs.on('end', bothEnd);
    rhs.on('end', bothEnd);
}

var smPath = path.join(__dirname, 'samples');
var opt = {encoding: 'utf8', autoClose: true};

fs.readdir(smPath, function (err, files) {
    if (err) throw err;
    files.forEach(function (file) {
        if (path.extname(file) !== '.m4') return;
        file = path.basename(file, '.m4');
        test('[m4] ' + file, function (t) {
            var filePath = path.join(smPath, file);
            var input = fs.createReadStream(filePath + '.m4', opt);
            var ref = fs.createReadStream(filePath, opt);
            var output = input.pipe(new M4());
            streamEqual(t, output, ref, function () {
                t.end();
            });
        });
    });
});

test('[m4] nesting limit', function (t) {
    t.plan(1);
    var output = new M4({nestingLimit: 2});
    output.on('error', function (err) {
        t.equal(err.code, M4Error.Code.E_NEST_LIMIT);
    });
    output.write('define(foo, define(bar, define(glo, 0)))');
    output.end();
});
