'use strict';

var test = require('tape');
var m4 = require('..');
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
var opt = {encoding: 'utf8'};

fs.readdir(smPath, function (err, files) {
    if (err) throw err;
    files.forEach(function (file) {
        if (path.extname(file) === '.m4') return;
        test(file, function (t) {
            var input = fs.createReadStream(path.join(smPath, file), opt);
            var ref = fs.createReadStream(path.join(smPath, file + '.m4'), opt);
            var output = input.pipe(m4());
            streamEqual(t, output, ref, function () {
                t.end();
            });
        });
    });
});

/*
test('passthrough', function (t) {
    t.plan(1);
    var s = m4();
    s.write('the cake is a lie');
    s.end();
    t.equal(s.read(), 'the cake is a lie');
});

test('no-param builtins', function (t) {
    t.plan(1);
    var s = m4();
    s.write('define');
    s.end();
    t.equal(s.read(), 'define');
});

test('define', function (t) {
    t.plan(1);
    var s = m4();
    s.write('define(foo,bar) foo');
    t.equal(s.read(), ' bar');
});

test('quotes', function (t) {
    t.plan(2);
    var s = m4();
    s.write('foo`\'bar');
    t.equal(s.read(), 'foobar');
    s.write('`foobar\'');
    t.equal(s.read(), 'foobar');
});

test('post-expansion tokenization', function (t) {
    t.plan(1);
    var s = m4();
    s.write('define(foo,bar)\ndefine(barglo,win)\n');
    s.write('foo()glo');
    s.end();
    t.equal(s.read(), '\n\nwin\n');
});
*/
