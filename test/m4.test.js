'use strict';

var test = require('tape');
var m4 = require('..');

test('passthrough', function (t) {
    t.plan(1);
    var s = m4();
    s.write('the cake is a lie');
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

test('expand', function (t) {
    t.plan(1);
    var s = m4.expand('foo$1bar$2glo$37fiz', 'ba', 'be', 'bi');
    t.equal(s, 'foobabarbeglofiz');
});
