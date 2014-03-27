changequote(`[', `]')
define([foo], [Macro [foo].])
foo

changequote(`, ')
changequote(`[[[', `]]]')
define([[[foo]]], [[[Macro [[[[[foo]]]]].]]])
foo
