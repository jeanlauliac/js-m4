changequote([,])dnl
define([gl_STRING_MODULE_INDICATOR],
  [dnl comment
  GNULIB_[]translit([[$1]], [a-z], [A-Z])=1dnl
])dnl
  gl_STRING_MODULE_INDICATOR([strcase])
