# http://www.gnu.org/software/m4/manual/m4.html#Pseudo-Arguments
define(`nargs', `$#')
nargs
nargs()
nargs(`arg1', `arg2', `arg3')
nargs(`commas can be quoted, like this')
nargs((unquoted parentheses, like this, group arguments))

define(`echo1', `$*')
echo1(arg1,    arg2, arg3 , arg4)

define(`echo2', `$@')
echo2(arg1,    arg2, arg3 , arg4)

define(`foo', `This is macro `foo'.')
echo1(foo)
echo1(`foo')
echo2(foo)
echo2(`foo')
