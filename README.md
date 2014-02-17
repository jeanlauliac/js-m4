# m4

*Work in progress!*

**m4** is a pure Javascript implementation of an
[m4](http://mbreen.com/m4.html) templating language interpreter. You can use it
with Node.js or in the browser, via browserify. A command-line version is
provided, usable as a drop-in replacement for a native version.

## Installation

    npm install m4

## Example usage

```
$ node example.js
boop
```

```js
// example.js
'use strict';

var Readable = require('stream').Readable;
var m4 = require('m4');

var input = new Readable();
input._read = function() {
    this.push('define(`beep', `boop')dnl\nbeep');
    this.push(null);
};

input.pipe(m4()).pipe(process.stdout);
```

## API

### Class: M4

#### new M4(opts)

  * `opts` *Object* Can contain.

#### m4.define(name, fn)

  * `name` Identifier.
  * `fn` Fonction called with `(str)`, must return the result as a string.

Define a M4 macro as a Javascript function.

#### m4.process([cb])

  * `cb` *Function* Called with arguments `(err, data)` with the result.

Process the input in the current context. Return a readable stream with the
processed output except if `cb` is specified.
