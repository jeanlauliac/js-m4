'use strict';

var test = require('tape');
var tokenizer = require('../lib/tokenizer');

test('id token', function (t) {
    t.plan(1);
    var s = tokenizer();
    s.push('foobar');
    s.end();
    t.same(s.read(), {type: tokenizer.Type.NAME, value: 'foobar'});
});

test('id token, multiple', function (t) {
    t.plan(5);
    var s = tokenizer();
    s.push('foobar glo');
    s.end();
    t.same(s.read(), {type: tokenizer.Type.NAME, value: 'foobar'});
    t.same(s.read(), {type: tokenizer.Type.LITERAL, value: ' '});
    t.same(s.read(), {type: tokenizer.Type.NAME, value: 'glo'});
    t.same(s.read(), {type: tokenizer.Type.END, value: ''});
    t.equal(s.read(), null);
});

test('quoted token', function (t) {
    t.plan(1);
    var s = tokenizer();
    s.push('`foobar\'');
    s.end();
    t.same(s.read(), {type: tokenizer.Type.STRING, value: 'foobar'});
});

test('string token', function (t) {
    t.plan(2);
    var s = tokenizer();
    s.push('汉语');
    s.end();
    t.same(s.read(), {type: tokenizer.Type.LITERAL, value: '汉'});
    t.same(s.read(), {type: tokenizer.Type.LITERAL, value: '语'});
});

test('end token', function (t) {
    t.plan(2);
    var s = tokenizer();
    s.push('a');
    s.end();
    s.read();
    t.same(s.read(), {type: tokenizer.Type.END, value: ''});
    t.equal(s.read(), null);
});
