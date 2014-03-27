'use strict';

var testRaw = require('tape');
var Tokenizer = require('../lib/tokenizer');

var test = function (name, fn) {
    testRaw('[tokenizer] ' + name, fn);
};

test('name token', function (t) {
    t.plan(1);
    var s = new Tokenizer();
    s.push('foobar');
    s.end();
    t.same(s.read(), {type: Tokenizer.Type.NAME, value: 'foobar'});
});

test('name token, multiple', function (t) {
    t.plan(5);
    var s = new Tokenizer();
    s.push('foobar glo');
    s.end();
    t.same(s.read(), {type: Tokenizer.Type.NAME, value: 'foobar'});
    t.same(s.read(), {type: Tokenizer.Type.LITERAL, value: ' '});
    t.same(s.read(), {type: Tokenizer.Type.NAME, value: 'glo'});
    t.same(s.read(), {type: Tokenizer.Type.END, value: ''});
    t.equal(s.read(), null);
});

test('string token', function (t) {
    t.plan(1);
    var s = new Tokenizer();
    s.push('`foo`b\'ar\'');
    s.end();
    t.same(s.read(), {type: Tokenizer.Type.STRING, value: 'foo`b\'ar'});
});

test('string token w/ custom quote', function (t) {
    t.plan(4);
    var s = new Tokenizer();
    s.changeQuote('<[', ']]>');
    s.push('the<<[foo<[b]]>ar]]>cake');
    s.end();
    t.same(s.read(), {type: Tokenizer.Type.NAME, value: 'the'});
    t.same(s.read(), {type: Tokenizer.Type.LITERAL, value: '<'});
    t.same(s.read(), {type: Tokenizer.Type.STRING, value: 'foo<[b]]>ar'});
    t.same(s.read(), {type: Tokenizer.Type.NAME, value: 'cake'});
});

test('literal token', function (t) {
    t.plan(2);
    var s = new Tokenizer();
    s.push('汉语');
    s.end();
    t.same(s.read(), {type: Tokenizer.Type.LITERAL, value: '汉'});
    t.same(s.read(), {type: Tokenizer.Type.LITERAL, value: '语'});
});

test('end token', function (t) {
    t.plan(2);
    var s = new Tokenizer();
    s.push('a');
    s.end();
    s.read();
    t.same(s.read(), {type: Tokenizer.Type.END, value: ''});
    t.equal(s.read(), null);
});
