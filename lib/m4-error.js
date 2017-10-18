'use strict';
/**
 * @see NodeJS Doc for Error.captureStackTrace
 * @classdesc NodeJS Error
 * @alias NodeJS_Error
 * @class
 * @augments Error
 * @private
 */

/**
 *
 * @method
 * @alias NodeJS_Error#captureStackTrace
 * @param {Object} ErrorObject - object to add stack property.
 * @param {Function=} ConstructorFunction - Optional constructor function
 * @private
 */
var util = require('util');

/**
 *
 * @type {M4Error}
 */
module.exports = M4Error;
util.inherits(M4Error, Error);


/**
 * @class module:M4.M4Error
 * @augments NodeJS_Error
 * @private
 */
function M4Error() {
    var args = Array.prototype.slice.call(arguments);
    var code = args.shift();
    var template = M4Error.Message[code];
    if (typeof template === 'undefined') template = 'unknow error';
    this.message = util.format.apply(null, [template].concat(args));
    this.code = code;
    this.args = args;
    Error.captureStackTrace(this, M4Error);
}

var Code = M4Error.Code = {
/**
 *
 * @readonly
 * @enum {number}
 */
    E_INV_RET: 1,
    E_NEST_LIMIT: 2,
    E_EOF_IN_STR: 65,
    W_TXT_UNDIV: 129,
    W_TOO_MANY_ARGS: 130
};

/**
 * @readonly
 * @enum {string}
 */
M4Error.Message = {};
M4Error.Message[Code.E_INV_RET] =
    'macro function `%s\' did not return a string';
M4Error.Message[Code.E_NEST_LIMIT] =
    'too much macro nesting (max. %s)';
M4Error.Message[Code.E_EOF_IN_STR] =
    'unexpected end of file in string (unmatched quote)';
M4Error.Message[Code.W_TXT_UNDIV] =
    'non-number `%s\' in undivert arguments (forgot to enable extensions?)';
M4Error.Message[Code.W_TOO_MANY_ARGS] =
    'excess arguments to builtin `%s\' ignored';
