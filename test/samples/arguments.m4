# http://www.gnu.org/software/m4/manual/m4.html#Macro-Arguments
define(`macro', `$1')
macro( unquoted leading space lost)
macro(` quoted leading space kept')
macro(
 divert `unquoted space kept after expansion')
macro(macro(`
')`whitespace from expansion kept')
macro(`unquoted trailing whitespace kept'
)

define(`f', `1')
f(define(`f', `2'))
