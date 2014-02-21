# m4

*Work in progress!*

**m4** is a pure Javascript implementation of an
[m4](http://mbreen.com/m4.html) macro language processor. You can use it
with Node.js or in the browser, via browserify. A command-line version is
provided, usable as a drop-in replacement for a native version
(such as [GNU M4](http://www.gnu.org/software/m4/)).

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

var M4 = require('m4');

var input = new M4();
input.pipe(M4()).pipe(process.stdout);

input.write("define(`beep', `boop')dnl\nbeep\n");
input.end();
```

## API

### Class: M4

Inherit [stream.Transform](http://nodejs.org/api/stream.html#stream_class_stream_transform_1).
As such this is a duplex stream you can pipe, write and read.

#### new M4(opts)

  * `opts` *Object* Options:
    * `nestingLimit` *Number* Maximum nested macro calls. Beware, this
      does not prevent [endless rescanning loops](http://www.gnu.org/software/m4/manual/m4.html#index-nesting-limit).

#### m4.define(name, {fn|str})

  * `name` *String* Identifier.
  * `fn` *Fonction* Called with `(name, [arg1, arg2 ... ])`, must return the
    macro expansion result as a string. `name` is the macro defined name itself.
  * `str` *String* Macro content, just like you were defining the macro in M4.

Define a M4 macro as a Javascript function.

#### m4.divert(bufferIx)

  * `bufferIx` *Number* Buffer index.

Change how the output is processed. If the index is zero, output is directly
emitted by the stream. If the index is a positive integer, the output is
stored in an internal buffer instead.

#### m4.undivert(bufferIx)

   * `bufferIx` *Number* Buffer index.

Output the content of the specified buffer. The buffer is emptied.

#### m4.dnl()

Put the stream into a special mode where all the tokens are ignored until the
next newline.
