'use strict';

module.exports = function (m4) {
    return new Builtins(m4);
};

function Builtins(m4) {
    this._m4 = m4;
}

Builtins.define = function (name, def) {
    m4.defineMacro(name, def);
}
