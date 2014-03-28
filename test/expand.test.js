'use strict';

var test = require('tape');
var expand = require('../lib/expand');

test('expand', function (t) {
    t.plan(1);
    var opts = {};
    var s = expand(opts, 'foo$1bar$2glo$37fiz', '', 'ba', 'be', 'bi');
    t.equal(s, 'foobabarbeglofiz');
});
