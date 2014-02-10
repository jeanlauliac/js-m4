'use strict';

var test = require('tape');
var tokenizer = require('../lib/tokenizer');

test('id token', function (t) {
    t.plan(1);
    var s = tokenizer();
    s.push('foobar');
    s.end();
    t.same(s.read(), {type: tokenizer.Type.ID, value: 'foobar'});
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
