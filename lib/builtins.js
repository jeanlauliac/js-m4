'use strict';

/**
 *
 * @param {module:M4} m4
 * @returns {Builtins}
 */
module.exports = function (m4) {
    return new Builtins(m4);
};

/**
 *
 * @param {module:M4} m4
 * @constructor
 * @alias module:M4.Builtins
 * @private
 */
function Builtins(m4) {
    this._m4 = m4;
}

Builtins.define = function (name, def) {
    m4.defineMacro(name, def);
}
