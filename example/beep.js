// example.js
'use strict';

var M4 = require('..');

var input = new M4();
input.pipe(process.stdout);

input.write("define(`beep', `boop')dnl\nbeep\n");
input.end();
