'use strict';

module.exports = expand;

function expand() {
    var args = Array.prototype.slice.call(arguments);
    var val = args.shift();
    val = val.replace(/\$([0-9]+)/g, function (match, nb) {
        nb = +nb;
        if (nb >= args.length) return '';
        return args[nb];
    });
    return val;
}
